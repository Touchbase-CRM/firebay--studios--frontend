import React, { useEffect, useMemo, useState } from "react";
import { getAuth } from "@/firebase";
import Swal from "sweetalert2";
import { useRouter } from "next/router";

import { NavBar } from "@/components/foundation-components/nav-bar";
import { SectioningTutorial } from "@/_pages/advanced-mode/script-to-ad/create-sections/components/tutorial/alert";
import DetectedSections from "@/_pages/advanced-mode/script-to-ad/create-sections/components/detected-sections";

import useUserInputsStore from "@/store/user-inputs";
import { Section } from "@/data-structures/section";
import withAuth from "@/hocs/with-auth";

import { PageShell, PageContent } from "@/components/ui/page-shell";
import { Stepper } from "@/components/ui/stepper";
import { Toolbar } from "@/components/ui/toolbar";
import { Card, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";

const CHARACTER_OVERFLOW_THRESHOLD = 15;
const CHARACTERS_PER_SEC = 15.2;

const STEPS = [
  { label: "Script" },
  { label: "Sections" },
  { label: "Stitch & export" },
];

const AD_LENGTHS = [10, 15, 30, 45, 60, 90, 120].map((s) => ({
  value: String(s),
  label: `${s} seconds`,
}));

function splitScriptIntoSections(script) {
  return script.split(/\s*\/\/\s*/).filter(Boolean);
}

function CreateSections() {
  const auth = getAuth();
  const router = useRouter();

  const {
    adLength,
    setAdLength,
    sectionsArray,
    setSectionsArray,
    setSectionHistoryArray,
    setNumSectionsIdentified,
    s2aAdvancedFreeStyleStatus,
    setS2aAdvancedFreeStyleStatus,
    reset: resetUserInputsStore,
  } = useUserInputsStore();

  const [localSectionsArray, setLocalSectionsArray] = useState(sectionsArray);
  // Restore the script from existing sections so users coming back from
  // the section editor don't lose their work.
  const [originalScript, setOriginalScript] = useState(() =>
    (sectionsArray || [])
      .map((s) => s.getCurrentContent() || s.getOriginalContent() || "")
      .join(" // ")
  );
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSectionsDrawer, setShowSectionsDrawer] = useState(false);

  const charLimit = useMemo(() => {
    return Math.round(parseInt(adLength, 10) * CHARACTERS_PER_SEC) - CHARACTER_OVERFLOW_THRESHOLD;
  }, [adLength]);

  const charCount = originalScript.length;
  const overLimit = charCount > charLimit;

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleScriptChange = (e) => {
    const value = e.target.value;
    setOriginalScript(value);
    const extractedSections = splitScriptIntoSections(value);
    setNumSectionsIdentified(extractedSections.length);
    setLocalSectionsArray(
      extractedSections.map(
        (content, idx) => new Section(idx, content, content, null, 0)
      )
    );
  };

  const handleClearScript = () => {
    setOriginalScript("");
    setLocalSectionsArray([]);
    setNumSectionsIdentified(0);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (charCount < 1) {
      Swal.fire({ icon: "error", title: "Script is empty", text: "Add some text before continuing." });
      return;
    }

    setSectionsArray(localSectionsArray);
    setSectionHistoryArray(new Array(localSectionsArray.length).fill(null));

    if (localSectionsArray.length !== 0) {
      router.push("/advanced-mode/script-to-ad/process-section/0");
    } else {
      const firstSection = new Section(0, originalScript, originalScript, null, 0);
      setSectionsArray([firstSection]);
      setSectionHistoryArray([null]);
      router.push("/advanced-mode/script-to-ad/process-section/0");
    }
  };

  const handleLogout = () => {
    resetUserInputsStore();
    localStorage.removeItem("user");
    auth
      .signOut()
      .then(() => router.push("/login"))
      .catch((error) => console.error("Logout Error:", error));
  };

  const counterText = (
    <span style={{ color: overLimit ? "var(--danger-500)" : "var(--text-muted)" }}>
      {charCount} / {charLimit}
    </span>
  );

  const sectionCount = localSectionsArray.length;
  const sectionsCta = originalScript === "" ? "Read tutorial" : "Inspect sections";
  const onSectionsCtaClick = () =>
    originalScript === "" ? setShowTutorial(true) : setShowSectionsDrawer(true);

  return (
    <PageShell>
      <NavBar links={[]} logoutHandler={handleLogout} />
      <Stepper steps={STEPS} current={0} />
      <PageContent maxWidth="800px">
        <Toolbar
          title="Write your script"
          description="Use // to mark section breaks. Each section becomes its own voice take."
          style={{ padding: "var(--space-2) 0 var(--space-6)" }}
        />

        <Card padding="var(--space-6)">
          <CardHeader
            title="Script editor"
            description="Choose an ad length, then write your script. We'll split it on // marks."
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <div style={{ maxWidth: 240 }}>
              <Select
                label="Ad length"
                value={adLength}
                onChange={(e) => setAdLength(e.target.value)}
                options={AD_LENGTHS}
              />
            </div>

            <Textarea
              label="Script"
              placeholder={`Write your ${adLength}-second spot. Use // between sections.`}
              value={originalScript}
              onChange={handleScriptChange}
              rows={6}
              counter={counterText}
              hint={
                overLimit
                  ? `Heads up — ${charCount - charLimit} characters over the recommended cap for ${adLength}s. Your spot may run long.`
                  : null
              }
            />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
              <Button variant="ghost" onClick={onSectionsCtaClick}>
                {sectionsCta}
              </Button>
              {sectionCount > 0 && (
                <Badge tone="success">
                  <i className="bi bi-check2-circle" />
                  {sectionCount} section{sectionCount !== 1 ? "s" : ""} detected
                </Badge>
              )}
            </div>
          </div>
        </Card>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-6)" }}>
          <Button variant="secondary" onClick={() => router.push("/home")}>
            Save & exit
          </Button>
          <Button onClick={handleSubmit} disabled={charCount === 0}>
            Continue
            <i className="bi bi-arrow-right" />
          </Button>
        </div>
      </PageContent>

      <DetectedSections
        show={showSectionsDrawer}
        handleClose={() => setShowSectionsDrawer(false)}
        sections={localSectionsArray}
      />

      <Drawer
        show={showTutorial}
        onHide={() => setShowTutorial(false)}
        title="How to write a Pyro script"
        description="A quick primer on the // section syntax."
        width="480px"
      >
        <SectioningTutorial />
      </Drawer>
    </PageShell>
  );
}

export default withAuth(CreateSections);
