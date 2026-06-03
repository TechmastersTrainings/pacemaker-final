"""
RAG (Retrieval-Augmented Generation) module – Task 3
- Loads a curated medical knowledge base (chunks)
- Embeds query with sentence-transformers (all-MiniLM-L6-v2)
- Returns top-K most similar chunks via cosine similarity
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import ClassVar

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)

# ── Knowledge base (static chunks – replace with DB/vector store in prod) ──────
MEDICAL_KNOWLEDGE_BASE: list[dict] = [
    {
        "id": "cardio_001",
        "topic": "cardiology",
        "text": (
            "Myocardial infarction (MI) occurs when blood flow to part of the heart is blocked, "
            "causing ischemia and necrosis. STEMI (ST-elevation MI) shows ST elevation on ECG "
            "and requires immediate reperfusion therapy within 90 minutes via PCI or thrombolysis. "
            "Classic symptoms include crushing chest pain, diaphoresis, nausea, and dyspnoea."
        ),
    },
    {
        "id": "cardio_002",
        "topic": "cardiology",
        "text": (
            "Heart failure is classified by ejection fraction: HFrEF (<40%), HFmrEF (40-49%), "
            "HFpEF (≥50%). Treatment of HFrEF includes ACE inhibitors/ARBs, beta-blockers, "
            "mineralocorticoid antagonists, and SGLT2 inhibitors. Loop diuretics relieve congestion."
        ),
    },
    {
        "id": "pharma_001",
        "topic": "pharmacology",
        "text": (
            "Beta-blockers competitively antagonise catecholamines at beta-adrenergic receptors. "
            "Cardioselective beta-1 blockers (metoprolol, atenolol) are preferred in asthma/COPD. "
            "They reduce HR, BP, and myocardial oxygen demand. Avoid abrupt withdrawal."
        ),
    },
    {
        "id": "pharma_002",
        "topic": "pharmacology",
        "text": (
            "ACE inhibitors (e.g., ramipril, lisinopril) block the conversion of angiotensin I to II, "
            "reducing vasoconstriction and aldosterone release. Key side effects: dry cough (10%), "
            "angioedema (rare), hyperkalaemia, teratogenicity. Monitor eGFR and potassium."
        ),
    },
    {
        "id": "resp_001",
        "topic": "respiratory",
        "text": (
            "Asthma is characterised by reversible airflow obstruction, bronchial hyperresponsiveness, "
            "and airway inflammation. Management follows a step-up approach: SABA PRN → low-dose ICS "
            "→ ICS+LABA → high-dose ICS+LABA ± tiotropium. Acute attacks require oxygen, SABA nebulisation, "
            "systemic corticosteroids, and MgSO4 for severe cases."
        ),
    },
    {
        "id": "resp_002",
        "topic": "respiratory",
        "text": (
            "COPD (Chronic Obstructive Pulmonary Disease) is progressive and largely irreversible. "
            "Spirometry shows FEV1/FVC <0.70 post-bronchodilator. GOLD classification grades severity. "
            "Treatment: smoking cessation, SABA/SAMA, LABA/LAMA, ICS for frequent exacerbators, "
            "pulmonary rehab. Supplemental O2 if PaO2 <7.3 kPa."
        ),
    },
    {
        "id": "neuro_001",
        "topic": "neurology",
        "text": (
            "Ischaemic stroke results from thromboembolic occlusion of cerebral arteries. "
            "IV alteplase (tPA) within 4.5 hours and mechanical thrombectomy within 24 hours "
            "for large vessel occlusion are key interventions. NIHSS scores severity. "
            "Secondary prevention: antiplatelet, statin, BP control, anticoagulation for AF."
        ),
    },
    {
        "id": "endo_001",
        "topic": "endocrinology",
        "text": (
            "Type 2 diabetes is characterised by insulin resistance and relative insulin deficiency. "
            "HbA1c target is typically <53 mmol/mol (7%). First-line therapy is metformin unless "
            "contraindicated. Add-ons: SGLT2i (cardiorenal benefit), GLP-1 RA (weight loss), "
            "DPP-4i (weight neutral), sulphonylureas (cheap, hypoglycaemia risk)."
        ),
    },
    {
        "id": "gastro_001",
        "topic": "gastroenterology",
        "text": (
            "Peptic ulcer disease (PUD) is caused by H. pylori infection (70-80%) or NSAIDs. "
            "H. pylori eradication: triple therapy (PPI + amoxicillin + clarithromycin × 7-14 days). "
            "Complications: bleeding (haematemesis/melaena), perforation, obstruction. "
            "PPIs heal ulcers and prevent NSAID-associated ulcers."
        ),
    },
    {
        "id": "obgyn_001",
        "topic": "obstetrics",
        "text": (
            "Ectopic pregnancy implants outside the uterus (95% in fallopian tube). "
            "Risk factors: prior ectopic, PID, tubal surgery, IUD, IVF. "
            "Presents with amenorrhoea, pelvic pain, vaginal bleeding. "
            "Beta-hCG elevated but below discriminatory zone for intrauterine sac. "
            "Treatment: methotrexate (unruptured, stable) or surgical (salpingectomy/salpingostomy)."
        ),
    },
    {
        "id": "surgery_001",
        "topic": "surgery",
        "text": (
            "Appendicitis is inflammation of the vermiform appendix, usually caused by luminal obstruction "
            "by a faecolith. Classic presentation: periumbilical pain migrating to right iliac fossa (RIF), "
            "nausea, vomiting, anorexia, low-grade fever. Rovsing's sign, McBurney's point tenderness, "
            "and rebound tenderness are key clinical signs. Alvarado score aids diagnosis. "
            "Investigations: raised WCC and CRP, USS or CT abdomen. "
            "Treatment: appendicectomy (laparoscopic preferred) or conservative antibiotics for uncomplicated cases. "
            "Complications include perforation, abscess, peritonitis."
        ),
    },
    {
        "id": "surgery_002",
        "topic": "surgery",
        "text": (
            "Bowel obstruction can be small or large bowel. Small bowel obstruction (SBO) commonly caused by "
            "adhesions (post-surgical), hernias, or malignancy. Features: colicky central abdominal pain, "
            "distension, vomiting, absolute constipation. AXR shows dilated loops with valvulae conniventes. "
            "Management: IV fluids, NG decompression, analgesia. Surgery if strangulation suspected."
        ),
    },
    {
        "id": "infect_001",
        "topic": "infectious disease",
        "text": (
            "Sepsis is life-threatening organ dysfunction caused by a dysregulated host response to infection. "
            "qSOFA criteria: RR ≥22, altered mentation, SBP ≤100. Sepsis-3 defines sepsis by SOFA score ≥2. "
            "Septic shock: vasopressors needed to maintain MAP ≥65 despite fluid resuscitation + lactate >2 mmol/L. "
            "Bundles: blood cultures, broad-spectrum antibiotics within 1 hour, IV fluids 30ml/kg, "
            "lactate measurement. Common sources: pneumonia, UTI, abdominal, skin."
        ),
    },
    {
        "id": "infect_002",
        "topic": "infectious disease",
        "text": (
            "Pneumonia is infection of lung parenchyma. Community-acquired pneumonia (CAP) commonly caused by "
            "Streptococcus pneumoniae, Haemophilus influenzae, Mycoplasma pneumoniae. "
            "CURB-65 score guides severity: Confusion, Urea >7, RR ≥30, BP <90/60, age ≥65. "
            "Score 0-1: home treatment; 2: hospital; 3+: ICU consideration. "
            "Treatment: amoxicillin ± clarithromycin (CAP); co-amoxiclav for aspiration."
        ),
    },
    {
        "id": "nephro_001",
        "topic": "nephrology",
        "text": (
            "Acute Kidney Injury (AKI) defined by rise in creatinine ≥26.5 μmol/L in 48h, or ≥1.5x baseline in 7 days, "
            "or urine output <0.5 ml/kg/h for ≥6h. Classified as pre-renal (hypovolaemia, sepsis), "
            "intrinsic (ATN, glomerulonephritis, interstitial nephritis), or post-renal (obstruction). "
            "Management: treat cause, IV fluids for pre-renal, stop nephrotoxins, monitor electrolytes, "
            "renal replacement therapy if severe."
        ),
    },
    {
        "id": "haem_001",
        "topic": "haematology",
        "text": (
            "Anaemia is defined as Hb <130 g/L (male) or <120 g/L (female). "
            "Iron deficiency anaemia (IDA): microcytic hypochromic, low ferritin, raised TIBC. "
            "Causes: blood loss (GI, menstrual), malabsorption. Treatment: oral ferrous sulphate. "
            "B12/folate deficiency: macrocytic megaloblastic anaemia, neurological symptoms in B12 deficiency. "
            "Haemolytic anaemia: raised bilirubin, LDH, reticulocytes; low haptoglobin."
        ),
    },
    {
        "id": "msk_001",
        "topic": "musculoskeletal",
        "text": (
            "Rheumatoid arthritis (RA) is a chronic inflammatory autoimmune arthritis. "
            "Symmetric small joint involvement (MCPs, PIPs), morning stiffness >1 hour, "
            "extra-articular manifestations (nodules, vasculitis, ILD). "
            "RF and anti-CCP positive in ~70-80%. Treat with DMARDs: methotrexate first-line, "
            "add hydroxychloroquine/sulfasalazine. Biologics (TNF inhibitors) for refractory disease. "
            "Monitor for MTX toxicity: LFTs, FBC."
        ),
    },
    {
        "id": "psych_001",
        "topic": "psychiatry",
        "text": (
            "Major depressive disorder (MDD) requires 5+ symptoms for ≥2 weeks including "
            "depressed mood or anhedonia. Other symptoms: weight change, insomnia/hypersomnia, "
            "psychomotor changes, fatigue, worthlessness, poor concentration, suicidal ideation. "
            "Treatment: SSRIs first-line (fluoxetine, sertraline), CBT, or combination. "
            "Severe/psychotic depression may require ECT. Always assess suicide risk."
        ),
    },
    {
        "id": "paeds_001",
        "topic": "paediatrics",
        "text": (
            "Febrile seizures occur in 2-4% of children aged 6 months to 5 years. "
            "Simple febrile seizure: generalised, <15 min, single episode in 24h. "
            "Complex: focal, >15 min, or multiple in 24h. "
            "Management: ensure safety, antipyretics, diazepam (PR/IV) for prolonged seizures. "
            "Reassure parents. Risk of epilepsy only slightly increased. "
            "Exclude meningitis (neck stiffness, photophobia, purpuric rash)."
        ),
    },
]


@dataclass
class RetrievedChunk:
    id: str
    topic: str
    text: str
    score: float


class MedicalRAG:
    """
    In-memory RAG engine using sentence-transformers for embedding
    and cosine similarity for retrieval.
    """

    _instance: ClassVar["MedicalRAG | None"] = None
    _model_name = "all-MiniLM-L6-v2"

    def __init__(self):
        self._embeddings: np.ndarray | None = None
        self._model = None
        self._loaded = False

    def _lazy_load(self):
        """Load model and embed knowledge base on first use."""
        if self._loaded:
            return
        try:
            from sentence_transformers import SentenceTransformer

            logger.info("Loading embedding model: %s", self._model_name)
            self._model = SentenceTransformer(self._model_name)
            texts = [chunk["text"] for chunk in MEDICAL_KNOWLEDGE_BASE]
            self._embeddings = self._model.encode(texts, convert_to_numpy=True)
            self._loaded = True
            logger.info(
                "RAG ready: %d chunks embedded.", len(MEDICAL_KNOWLEDGE_BASE)
            )
        except Exception as exc:
            logger.error("Failed to load embedding model: %s", exc)
            self._loaded = False

    def retrieve(self, query: str, top_k: int = 3) -> list[RetrievedChunk]:
        """
        Embed *query* and return top-K chunks by cosine similarity.
        Falls back to keyword-matching if the model fails to load.
        """
        self._lazy_load()

        if self._loaded and self._model is not None:
            query_emb = self._model.encode([query], convert_to_numpy=True)
            scores = cosine_similarity(query_emb, self._embeddings)[0]
            top_indices = np.argsort(scores)[::-1][:top_k]
            return [
                RetrievedChunk(
                    id=MEDICAL_KNOWLEDGE_BASE[i]["id"],
                    topic=MEDICAL_KNOWLEDGE_BASE[i]["topic"],
                    text=MEDICAL_KNOWLEDGE_BASE[i]["text"],
                    score=float(scores[i]),
                )
                for i in top_indices
            ]

        # Fallback: simple keyword matching
        logger.warning("Using keyword fallback for RAG retrieval.")
        q_lower = query.lower()
        scored = [
            (chunk, sum(1 for w in q_lower.split() if w in chunk["text"].lower()))
            for chunk in MEDICAL_KNOWLEDGE_BASE
        ]
        scored.sort(key=lambda x: x[1], reverse=True)
        return [
            RetrievedChunk(id=c["id"], topic=c["topic"], text=c["text"], score=float(s))
            for c, s in scored[:top_k]
        ]

    @classmethod
    def get_instance(cls) -> "MedicalRAG":
        if cls._instance is None:
            cls._instance = MedicalRAG()
        return cls._instance


def get_rag() -> MedicalRAG:
    return MedicalRAG.get_instance()
