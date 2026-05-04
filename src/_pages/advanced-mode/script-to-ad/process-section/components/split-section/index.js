import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Section } from "@/data-structures/section";
import useUserInputsStore from "@/store/user-inputs";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const SplitSection = ({
  show,
  onHide,
  currentSectionContent,
  currentSectionCharCount,
  localCurrentSectionObj,
  localSectionsArray,
  setLocalSectionsArray,
  setTransformedWords,
  setLocalSectionHistoryObj,
  processScriptChange,
  localPushData,
}) => {
  const [newContent, setNewContent] = useState(currentSectionContent || "");
  const [newSectionContent, setNewSectionContent] = useState("");

  const { numSectionsIdentified, setNumSectionsIdentified } = useUserInputsStore();

  useEffect(() => {
    if (show) {
      setNewContent(currentSectionContent || "");
      setNewSectionContent("");
    }
  }, [show, currentSectionContent]);

  const totalTypedChars = newContent.length + newSectionContent.length;
  const overLimit = totalTypedChars > currentSectionCharCount;

  const handleSave = () => {
    if (!newContent.trim()) {
      toast.error("Add content for the current section.");
      return;
    }
    if (!newSectionContent.trim()) {
      toast.error("Add content for the new section.");
      return;
    }

    processScriptChange(newContent);
    localCurrentSectionObj.setHistoryItemId(null);
    localCurrentSectionObj.setCurrentContent(newContent);
    localCurrentSectionObj.setCurrentWords(newContent.split(" "));
    localCurrentSectionObj.setCurrentTransformations({});
    localCurrentSectionObj.setGeneratedVoiceUrl("");
    setTransformedWords({});
    setLocalSectionHistoryObj(null);

    const newSectionIndex = localCurrentSectionObj.getIndex() + 1;
    const section = new Section(newSectionIndex, newSectionContent, newSectionContent, null, 0);
    section.setDragonBreathEnhancement(localCurrentSectionObj.getDragonBreathEnhancement());
    section.setVoiceId(localCurrentSectionObj.getVoiceId());
    section.setVoiceName(localCurrentSectionObj.getVoiceName());
    section.setVoicePreviewFilename(localCurrentSectionObj.getVoicePreviewFilename());
    section.setModelId(localCurrentSectionObj.getModelId());
    section.setVoiceIntonationConsistency(localCurrentSectionObj.getVoiceIntonationConsistency());
    section.setSpeechRate(localCurrentSectionObj.getSpeechRate());

    const updated = [...localSectionsArray];
    for (let i = updated.length - 1; i >= newSectionIndex; i--) {
      updated[i].setIndex(updated[i].getIndex() + 1);
    }
    updated.splice(newSectionIndex, 0, section);

    setLocalSectionsArray(updated);
    setNumSectionsIdentified(numSectionsIdentified + 1);

    localPushData(`/advanced-mode/script-to-ad/process-section/${localCurrentSectionObj.getIndex() + 1}`);
    onHide();
  };

  const sectionIdx = localCurrentSectionObj.getIndex() + 1;

  return (
    <Modal
      show={show}
      onHide={onHide}
      title={`Split section ${sectionIdx}`}
      description="Break this section into two. The new section inherits the same voice and settings."
      size="lg"
      primaryAction={{ label: "Save split", onClick: handleSave, disabled: overLimit }}
      secondaryAction={{ label: "Cancel", onClick: onHide }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div
          style={{
            backgroundColor: "var(--surface-inset)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-3) var(--space-4)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
            <span style={{ fontSize: "var(--text-xs)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Current content
            </span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
              {currentSectionCharCount} chars
            </span>
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", whiteSpace: "pre-wrap", lineHeight: 1.5, wordBreak: "break-word", overflowWrap: "anywhere" }}>
            {currentSectionContent}
          </div>
        </div>

        <Textarea
          label={`Section ${sectionIdx} content`}
          rows={4}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="What stays in the current section."
        />

        <Textarea
          label={`Section ${sectionIdx + 1} content (new)`}
          rows={4}
          value={newSectionContent}
          onChange={(e) => setNewSectionContent(e.target.value)}
          placeholder="What moves to the new section."
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
            Combined: {totalTypedChars} / {currentSectionCharCount}
          </span>
          {overLimit && <Badge tone="danger">Over the cap</Badge>}
        </div>
      </div>
    </Modal>
  );
};

export default SplitSection;
