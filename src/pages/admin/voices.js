import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs, getFirestore, orderBy, query } from "firebase/firestore";
import { getAuth } from "firebase/auth";
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

import app from "@/firebase";
import { useAuth } from "@/context/auth";
import withAdminAuth from "@/hocs/with-admin-auth";

const PREVIEW_BASE_URL =
  "https://static--files--storage.s3.us-east-2.amazonaws.com/voice--previews/";
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";
const EMPTY_FORM = {
  pyro_name: "",
  elevenlabs_id: "",
  voice_gender: "female",
  model_id: DEFAULT_MODEL_ID,
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

function VoiceFormFields({ form, setForm, includeFile, fileLabel }) {
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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(getFirestore(app), "pyro_voices"), orderBy("pyro_name"))
      );
      setVoices(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }))
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
      fd.append("original_pyro_name", editing.pyro_name);
      fd.append("pyro_name", editForm.pyro_name);
      fd.append("elevenlabs_id", editForm.elevenlabs_id);
      fd.append("voice_gender", editForm.voice_gender);
      fd.append("model_id", editForm.model_id);
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
        body: JSON.stringify({ pyro_name: voice.pyro_name }),
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
          <Badge bg="secondary">{voices.length}</Badge>
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
                  <th>Model</th>
                  <th>ElevenLabs ID</th>
                  <th>Preview</th>
                  <th style={{ width: 180 }}></th>
                </tr>
              </thead>
              <tbody>
                {voices.map((v) => (
                  <tr key={v.id}>
                    <td>{v.pyro_name}</td>
                    <td>{genderOf(v)}</td>
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
