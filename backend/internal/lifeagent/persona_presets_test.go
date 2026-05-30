package lifeagent

import "testing"

func TestPersonaPresetForIDStable(t *testing.T) {
	a := PersonaPresetForID("abc-123")
	b := PersonaPresetForID("abc-123")
	if a.PersonaArchetype != b.PersonaArchetype || a.ToneStyle != b.ToneStyle {
		t.Fatalf("expected stable preset, got %+v vs %+v", a, b)
	}
}

func TestEnrichProfileForAI(t *testing.T) {
	out := EnrichProfileForAI("profile-1", ProfileForAI{DisplayName: "测试"})
	if out.PersonaArchetype == "" || out.ToneStyle == "" {
		t.Fatalf("expected persona enrichment, got %+v", out)
	}
}

func TestEnrichProfileForAIKeepsCustom(t *testing.T) {
	in := ProfileForAI{
		DisplayName:      "测试",
		PersonaArchetype: "自定义",
		ToneStyle:        "自定义语气",
	}
	out := EnrichProfileForAI("profile-1", in)
	if out.PersonaArchetype != "自定义" || out.ToneStyle != "自定义语气" {
		t.Fatalf("expected custom persona preserved, got %+v", out)
	}
}
