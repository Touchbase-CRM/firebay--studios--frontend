import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
} from "firebase/firestore";
import { getAuth } from "@/firebase";
import Swal from "sweetalert2";
import {
  Alert,
  Badge,
  Button,
  Card,
  Container,
  Form,
  Modal,
  Spinner,
  Table,
} from "react-bootstrap";

import app, { isUiPreviewMode } from "@/firebase";
import { PREVIEW_VOICES, PREVIEW_VOICE_CATEGORIES } from "@/lib/voicesPreview";
import { useAuth } from "@/context/auth";
import withAdminAuth from "@/hocs/with-admin-auth";
import { VOICE_AGES, normalizeAge } from "@/lib/voiceAges";

const PREVIEW_BASE_URL =
  "https://static--files--storage.s3.us-east-2.amazonaws.com/voice--previews/";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const DESCRIPTION_MAX_CHARS = 43;
const UNCATEGORIZED = "__uncategorized__";
// Accent suggestions; stored as the voice's `nationality` field.
const DEFAULT_NATIONALITIES = [
  "American",
  "British",
  "Australian",
  "Spanish",
  "Indian",
  "African",
];
const EMPTY_FORM = {
  pyro_name: "",
  elevenlabs_id: "",
  voice_gender: "female",
  model_id: DEFAULT_MODEL_ID,
  categories: [],
  description: "",
  age: "",
  nationality: "",
};

function genderOf(voice) {
  return (voice.voice_preview_filename || "").split("/")[0] || "—";
}

async function getIdToken() {
  const user = getAuth(app).currentUser;
  if (!user) throw new Error("Not signed in.");
  return user.getIdToken();
}

async function showApiError(response, fallback) {
  let body = {};
  try {
    body = await response.json();
  } catch (e) {
    body = {};
  }
  const text = body.error || fallback || "Something went wrong.";
  const hint = body.hint ? `\n\n${body.hint}` : "";
  await Swal.fire({
    icon: "error",
    title: body.field ? `Issue with ${body.field}` : "Action failed",
    text: `${text}${hint}`,
  });
}

function toggleCategory(list, name) {
  return list.includes(name) ? list.filter((c) => c !== name) : [...list, name];
}

function VoiceFormFields({
  form,
  setForm,
  includeFile,
  fileLabel,
  categoryOptions,
  nationalityOptions,
  idPrefix,
}) {
  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Display name</Form.Label>
        <Form.Control
          type="text"
          value={form.pyro_name}
          maxLength={80}
          onChange={(e) => setForm({ ...form, pyro_name: e.target.value })}
          placeholder='e.g. "Charley (Cloned)"'
          required
        />
        <Form.Text muted>
          Shown in the Pyro voice dropdown. Must be unique.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>ElevenLabs voice ID</Form.Label>
        <Form.Control
          type="text"
          value={form.elevenlabs_id}
          onChange={(e) => setForm({ ...form, elevenlabs_id: e.target.value })}
          placeholder="e.g. y2w7EDZ1aojHdjnQqDG5"
          required
        />
        <Form.Text muted>
          Add the voice in elevenlabs.io first, then paste its ID here.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Voice gender</Form.Label>
        <div>
          <Form.Check
            inline
            type="radio"
            label="Female"
            name="voice_gender"
            checked={form.voice_gender === "female"}
            onChange={() => setForm({ ...form, voice_gender: "female" })}
          />
          <Form.Check
            inline
            type="radio"
            label="Male"
            name="voice_gender"
            checked={form.voice_gender === "male"}
            onChange={() => setForm({ ...form, voice_gender: "male" })}
          />
        </div>
        <Form.Text muted>
          Used for pronoun selection in emotional script preprocessing.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Model ID</Form.Label>
        <Form.Control
          type="text"
          value={form.model_id}
          onChange={(e) => setForm({ ...form, model_id: e.target.value })}
          placeholder={DEFAULT_MODEL_ID}
        />
        <Form.Text muted>Defaults to {DEFAULT_MODEL_ID}.</Form.Text>
      </Form.Group>

      <div className="d-flex gap-3 mb-3">
        <Form.Group style={{ flex: 1 }}>
          <Form.Label>Age</Form.Label>
          <Form.Select
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
          >
            <option value="">—</option>
            {VOICE_AGES.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
        <Form.Group style={{ flex: 1 }}>
          <Form.Label>Accent</Form.Label>
          <Form.Control
            type="text"
            list={`${idPrefix}-nationalities`}
            value={form.nationality}
            maxLength={30}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            placeholder="e.g. British"
          />
          <datalist id={`${idPrefix}-nationalities`}>
            {nationalityOptions.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </Form.Group>
      </div>
      <Form.Text muted className="d-block mb-3" style={{ marginTop: -8 }}>
        Age and accent power the filters in Pyro's voice picker.
      </Form.Text>

      <Form.Group className="mb-3">
        <Form.Label>Categories</Form.Label>
        {categoryOptions.length === 0 ? (
          <Form.Text muted className="d-block">
            No categories yet. Add some in the Categories card below.
          </Form.Text>
        ) : (
          <div>
            {categoryOptions.map((c) => (
              <Form.Check
                key={c}
                inline
                type="checkbox"
                id={`${idPrefix}-category-${c}`}
                label={c}
                checked={form.categories.includes(c)}
                onChange={() =>
                  setForm({ ...form, categories: toggleCategory(form.categories, c) })
                }
              />
            ))}
          </div>
        )}
        <Form.Text muted>
          Groups the voice in Pyro's dropdown. A voice can be in more than one.
        </Form.Text>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          value={form.description}
          maxLength={DESCRIPTION_MAX_CHARS}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder='e.g. "Spanish accent. Great for Spanish language."'
        />
        <Form.Text muted>
          Shown under the voice name in Pyro. {form.description.length}/
          {DESCRIPTION_MAX_CHARS}
        </Form.Text>
      </Form.Group>

      {includeFile && (
        <Form.Group className="mb-3">
          <Form.Label>{fileLabel}</Form.Label>
          <Form.Control
            type="file"
            accept="audio/mpeg,.mp3"
            onChange={(e) =>
              setForm({ ...form, _file: e.target.files?.[0] || null })
            }
          />
          <Form.Text muted>MP3, ≤ 5 MB. Plays in the voice preview.</Form.Text>
        </Form.Group>
      )}
    </>
  );
}

function AdminVoicesPage() {
  const { user } = useAuth();
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({ ...EMPTY_FORM, _file: null });
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    if (isUiPreviewMode) {
      setVoices(PREVIEW_VOICES);
      setCategories(PREVIEW_VOICE_CATEGORIES);
      setLoading(false);
      return;
    }
    try {
      const db = getFirestore(app);
      const [snap, categoriesSnap] = await Promise.all([
        getDocs(query(collection(db, "pyro_voices"), orderBy("pyro_name"))),
        getDoc(doc(db, "fetch_data_to_frontend", "pyro_voice_categories")),
      ]);
      setVoices(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      );
      setCategories(
        (categoriesSnap.exists() && categoriesSnap.data().categories) || []
      );
    } catch (e) {
      console.error("Failed to load voices", e);
      await Swal.fire({
        icon: "error",
        title: "Could not load voices",
        text: e.message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await getIdToken();
      const fd = new FormData();
      fd.append("pyro_name", addForm.pyro_name);
      fd.append("elevenlabs_id", addForm.elevenlabs_id);
      fd.append("voice_gender", addForm.voice_gender);
      fd.append("model_id", addForm.model_id);
      fd.append("categories", JSON.stringify(addForm.categories));
      fd.append("description", addForm.description);
      fd.append("age", addForm.age);
      fd.append("nationality", addForm.nationality);
      if (addForm._file) fd.append("preview", addForm._file);
      const r = await fetch("/api/admin/voices/add", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!r.ok) {
        await showApiError(r, "Could not add voice.");
        return;
      }
      await Swal.fire({
        icon: "success",
        title: "Voice added",
        text: `'${addForm.pyro_name}' is now in the Pyro voice dropdown.`,
        timer: 2200,
        showConfirmButton: false,
      });
      setAddForm({ ...EMPTY_FORM, _file: null });
      const fileInput = document.querySelector(
        '#admin-voices-add input[type="file"]'
      );
      if (fileInput) fileInput.value = "";
      refresh();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Add failed", text: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (voice) => {
    setEditing(voice);
    setEditForm({
      pyro_name: voice.pyro_name || "",
      elevenlabs_id: voice.elevenlabs_id || "",
      voice_gender: genderOf(voice) === "male" ? "male" : "female",
      model_id: voice.model_id || DEFAULT_MODEL_ID,
      categories: (voice.categories || []).filter((c) => categories.includes(c)),
      description: voice.description || "",
      age: normalizeAge(voice.age),
      nationality: voice.nationality || "",
      _file: null,
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setEditForm(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editing || !editForm) return;
    setSubmitting(true);
    try {
      const token = await getIdToken();
      const fd = new FormData();
      fd.append("original_id", editing.id);
      fd.append("original_pyro_name", editing.pyro_name);
      fd.append("pyro_name", editForm.pyro_name);
      fd.append("elevenlabs_id", editForm.elevenlabs_id);
      fd.append("voice_gender", editForm.voice_gender);
      fd.append("model_id", editForm.model_id);
      fd.append("categories", JSON.stringify(editForm.categories));
      fd.append("description", editForm.description);
      fd.append("age", editForm.age);
      fd.append("nationality", editForm.nationality);
      if (editForm._file) fd.append("preview", editForm._file);
      const r = await fetch("/api/admin/voices/update", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!r.ok) {
        await showApiError(r, "Could not save changes.");
        return;
      }
      await Swal.fire({
        icon: "success",
        title: "Saved",
        timer: 1600,
        showConfirmButton: false,
      });
      closeEdit();
      refresh();
    } catch (err) {
      await Swal.fire({ icon: "error", title: "Save failed", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (voice) => {
    const c = await Swal.fire({
      icon: "warning",
      title: `Remove '${voice.pyro_name}'?`,
      text:
        "This unlists the voice from Pyro and deletes its preview MP3 from S3. " +
        "The voice itself stays in your ElevenLabs account.",
      showCancelButton: true,
      confirmButtonText: "Remove",
      confirmButtonColor: "#d33",
    });
    if (!c.isConfirmed) return;
    setSubmitting(true);
    try {
      const token = await getIdToken();
      const r = await fetch("/api/admin/voices/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: voice.id, pyro_name: voice.pyro_name }),
      });
      if (!r.ok) {
        await showApiError(r, "Could not remove voice.");
        return;
      }
      await Swal.fire({
        icon: "success",
        title: "Removed",
        timer: 1400,
        showConfirmButton: false,
      });
      refresh();
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Remove failed", text: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  const saveCategories = async (next, renames) => {
    setSubmitting(true);
    try {
      const token = await getIdToken();
      const r = await fetch("/api/admin/voices/categories", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ categories: next, renames }),
      });
      if (!r.ok) {
        await showApiError(r, "Could not save categories.");
        return false;
      }
      await refresh();
      return true;
    } catch (e) {
      await Swal.fire({ icon: "error", title: "Save failed", text: e.message });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const nationalityOptions = useMemo(
    () =>
      [...new Set([...DEFAULT_NATIONALITIES, ...voices.map((v) => v.nationality).filter(Boolean)])].sort(),
    [voices]
  );

  const voicesIn = (name) =>
    voices.filter((v) => (v.categories || []).includes(name)).length;

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    if (await saveCategories([...categories, name])) setNewCategory("");
  };

  const moveCategory = (index, delta) => {
    const next = [...categories];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    saveCategories(next);
  };

  const handleRenameCategory = async (name) => {
    const r = await Swal.fire({
      title: `Rename '${name}'`,
      input: "text",
      inputValue: name,
      showCancelButton: true,
      confirmButtonText: "Rename",
    });
    const next = (r.value || "").trim();
    if (!r.isConfirmed || !next || next === name) return;
    await saveCategories(
      categories.map((c) => (c === name ? next : c)),
      { [name]: next }
    );
    if (categoryFilter === name) setCategoryFilter(next);
  };

  const handleDeleteCategory = async (name) => {
    const count = voicesIn(name);
    const c = await Swal.fire({
      icon: "warning",
      title: `Delete '${name}'?`,
      text:
        count > 0
          ? `${count} voice${count === 1 ? "" : "s"} will lose this category. The voices themselves stay.`
          : "No voices use this category.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
    });
    if (!c.isConfirmed) return;
    await saveCategories(categories.filter((x) => x !== name));
    if (categoryFilter === name) setCategoryFilter("");
  };

  const visibleVoices = voices.filter((v) => {
    if (!categoryFilter) return true;
    const own = (v.categories || []).filter((c) => categories.includes(c));
    if (categoryFilter === UNCATEGORIZED) return own.length === 0;
    return own.includes(categoryFilter);
  });

  const previewUrl = (voice, cacheBust) => {
    if (!voice.voice_preview_filename) return null;
    const base = `${PREVIEW_BASE_URL}${voice.voice_preview_filename}`;
    return cacheBust ? `${base}?t=${cacheBust}` : base;
  };

  const cacheKey = useMemo(() => Date.now(), [voices]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        backgroundImage: "none",
      }}
    >
    <Container className="py-4" style={{ maxWidth: 1100 }}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="mb-1">Voice library</h1>
          <p className="text-muted mb-0">
            Add or remove ElevenLabs voices that show up in Pyro's voice
            dropdown. Signed in as <strong>{user?.email}</strong>.
          </p>
        </div>
      </div>

      <Card className="mb-4" id="admin-voices-add">
        <Card.Header>Add a voice</Card.Header>
        <Card.Body>
          <Alert variant="light" className="mb-3">
            Already added the voice in <code>elevenlabs.io</code>? Paste its
            voice ID below, upload a short preview MP3, and it will appear in
            Pyro right away.
          </Alert>
          <Form onSubmit={handleAdd}>
            <VoiceFormFields
              form={addForm}
              setForm={setAddForm}
              includeFile={true}
              fileLabel="Preview MP3"
              categoryOptions={categories}
              nationalityOptions={nationalityOptions}
              idPrefix="add"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              style={{ backgroundColor: "#EB631C", borderColor: "#EB631C" }}
            >
              {submitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" /> Adding…
                </>
              ) : (
                "Add voice"
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>Current voices</span>
          <div className="d-flex align-items-center gap-2">
            <Form.Select
              size="sm"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: 220 }}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value={UNCATEGORIZED}>Uncategorized</option>
            </Form.Select>
            <Badge bg="secondary">
              {categoryFilter ? `${visibleVoices.length} / ${voices.length}` : voices.length}
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : voices.length === 0 ? (
            <Alert variant="warning" className="mb-0">
              No voices yet. Add one above and it will appear here.
            </Alert>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead>
                <tr>
                  <th>Display name</th>
                  <th>Gender</th>
                  <th>Age</th>
                  <th>Accent</th>
                  <th>Categories</th>
                  <th>Description</th>
                  <th>Model</th>
                  <th>ElevenLabs ID</th>
                  <th>Preview</th>
                  <th style={{ width: 180 }}></th>
                </tr>
              </thead>
              <tbody>
                {visibleVoices.map((v) => (
                  <tr key={v.id}>
                    <td>{v.pyro_name}</td>
                    <td>{genderOf(v)}</td>
                    <td>{normalizeAge(v.age) || <span className="text-muted">—</span>}</td>
                    <td>{v.nationality || <span className="text-muted">—</span>}</td>
                    <td>
                      {(v.categories || [])
                        .filter((c) => categories.includes(c))
                        .map((c) => (
                          <Badge key={c} bg="light" text="dark" className="me-1 border">
                            {c}
                          </Badge>
                        ))}
                    </td>
                    <td
                      title={v.description || ""}
                      style={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {v.description || <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <code style={{ fontSize: 12 }}>{v.model_id}</code>
                    </td>
                    <td>
                      <code style={{ fontSize: 12 }}>{v.elevenlabs_id}</code>
                    </td>
                    <td>
                      {previewUrl(v, cacheKey) ? (
                        <audio
                          src={previewUrl(v, cacheKey)}
                          controls
                          preload="none"
                          style={{ height: 32, maxWidth: 220 }}
                        />
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="me-2"
                        onClick={() => openEdit(v)}
                        disabled={submitting}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDelete(v)}
                        disabled={submitting}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      <Card className="mt-4" id="admin-voices-categories">
        <Card.Header>Categories</Card.Header>
        <Card.Body>
          <p className="text-muted">
            Pyro's voice dropdown shows these groups in this order. Voices with
            no category appear at the end under "Other voices".
          </p>
          {categories.length > 0 && (
            <Table size="sm" className="mb-3 align-middle">
              <tbody>
                {categories.map((c, i) => (
                  <tr key={c}>
                    <td>{c}</td>
                    <td className="text-muted" style={{ width: 110 }}>
                      {voicesIn(c)} voice{voicesIn(c) === 1 ? "" : "s"}
                    </td>
                    <td className="text-end" style={{ width: 260 }}>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="me-1"
                        onClick={() => moveCategory(i, -1)}
                        disabled={submitting || i === 0}
                        aria-label={`Move ${c} up`}
                      >
                        ↑
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="me-2"
                        onClick={() => moveCategory(i, 1)}
                        disabled={submitting || i === categories.length - 1}
                        aria-label={`Move ${c} down`}
                      >
                        ↓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        className="me-2"
                        onClick={() => handleRenameCategory(c)}
                        disabled={submitting}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-danger"
                        onClick={() => handleDeleteCategory(c)}
                        disabled={submitting}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
          <Form onSubmit={handleAddCategory} className="d-flex gap-2">
            <Form.Control
              type="text"
              value={newCategory}
              maxLength={40}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder='e.g. "Male · Young"'
              style={{ maxWidth: 320 }}
            />
            <Button
              type="submit"
              variant="outline-primary"
              disabled={submitting || !newCategory.trim()}
            >
              Add category
            </Button>
          </Form>
        </Card.Body>
      </Card>

      <Modal show={!!editing} onHide={closeEdit} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Edit voice</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEditSubmit}>
          <Modal.Body>
            {editForm && (
              <>
                <Alert variant="light">
                  Renaming this voice updates the dropdown and moves the preview
                  in S3 to the new name. Leave the file field empty to keep the
                  existing preview.
                </Alert>
                <VoiceFormFields
                  form={editForm}
                  setForm={setEditForm}
                  includeFile={true}
                  fileLabel="Replace preview MP3 (optional)"
                  categoryOptions={categories}
                  nationalityOptions={nationalityOptions}
                  idPrefix="edit"
                />
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeEdit} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
              style={{ backgroundColor: "#EB631C", borderColor: "#EB631C" }}
            >
              {submitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" /> Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
    </div>
  );
}

export default withAdminAuth(AdminVoicesPage);
