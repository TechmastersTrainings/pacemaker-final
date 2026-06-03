"""
PDF Generator – generates downloadable PDFs for all endpoint responses.
Uses fpdf2 library for clean, styled PDF output.
"""
import io
from datetime import datetime
from fpdf import FPDF, XPos, YPos


# ── Brand colours (RGB) ───────────────────────────────────────────────────────
PRIMARY   = (37,  99, 235)   # blue-600
SECONDARY = (99,  102, 241)  # indigo-500
SUCCESS   = (22,  163,  74)  # green-600
DARK      = (15,  23,  42)   # slate-900
GRAY      = (100, 116, 139)  # slate-500
LIGHT_BG  = (241, 245, 249)  # slate-100
WHITE     = (255, 255, 255)


class MedicalPDF(FPDF):
    """Custom FPDF subclass with shared header/footer and helpers."""

    def __init__(self, title: str):
        super().__init__()
        self.report_title = title
        self.set_auto_page_break(auto=True, margin=20)
        self.add_page()
        self._draw_header()

    def normalize_text(self, text):
        """Override to translate non-latin-1 characters safely instead of crashing."""
        if not isinstance(text, str):
            text = str(text)
        
        # Map common high-unicode characters to safe equivalents
        replacements = {
            "\u2013": "-",  # en-dash
            "\u2014": "-",  # em-dash
            "\u2018": "'",  # left single quote
            "\u2019": "'",  # right single quote
            "\u201c": '"',  # left double quote
            "\u201d": '"',  # right double quote
            "\u2022": "*",  # bullet point
            "\u2714": "[X]", # checkmark
            "\u25cb": "[ ]", # circle
        }
        for unichr, replacement in replacements.items():
            text = text.replace(unichr, replacement)

        try:
            # Check if it encodes to latin-1 safely
            text.encode("latin-1")
            return super().normalize_text(text)
        except UnicodeEncodeError:
            # Replace unsupported characters with '?' to prevent crashing
            cleaned = text.encode("latin-1", errors="replace").decode("latin-1")
            return super().normalize_text(cleaned)

    # ── Header & Footer ───────────────────────────────────────────────────────

    def _draw_header(self):
        # Blue banner
        self.set_fill_color(*PRIMARY)
        self.rect(0, 0, 210, 32, "F")

        # Logo text
        self.set_xy(10, 8)
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(*WHITE)
        self.cell(0, 8, "Groq Medical AI Service", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Subtitle
        self.set_font("Helvetica", "", 9)
        self.set_x(10)
        self.cell(0, 5, self.report_title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Timestamp (right-aligned)
        ts = datetime.now().strftime("%d %b %Y  %H:%M")
        self.set_xy(0, 10)
        self.set_font("Helvetica", "", 8)
        self.cell(200, 5, f"Generated: {ts}", align="R")

        self.ln(18)
        self.set_text_color(*DARK)

    def footer(self):
        self.set_y(-14)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(*GRAY)
        self.set_fill_color(*LIGHT_BG)
        self.rect(0, self.get_y() - 2, 210, 16, "F")
        self.cell(0, 8, f"Page {self.page_no()}  |  Groq Medical AI Service – Confidential", align="C")

    # ── Helpers ───────────────────────────────────────────────────────────────

    def section_title(self, text: str):
        self.set_fill_color(*LIGHT_BG)
        self.set_draw_color(*PRIMARY)
        self.set_font("Helvetica", "B", 11)
        self.set_text_color(*PRIMARY)
        self.rect(10, self.get_y(), 190, 8, "F")
        self.set_x(12)
        self.cell(0, 8, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)
        self.set_text_color(*DARK)

    def label_value(self, label: str, value: str, label_w: int = 42):
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*GRAY)
        self.set_x(12)
        self.cell(label_w, 6, label.upper(), new_x=XPos.RIGHT)
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        self.multi_cell(0, 6, value, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def body_text(self, text: str):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(*DARK)
        self.set_x(12)
        self.multi_cell(186, 5.5, text, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(2)

    def badge(self, label: str, colour: tuple):
        self.set_fill_color(*colour)
        self.set_text_color(*WHITE)
        self.set_font("Helvetica", "B", 8)
        self.set_x(12)
        self.cell(len(label) * 2.8 + 6, 6, f"  {label}  ", fill=True, new_x=XPos.RIGHT)
        self.ln(8)
        self.set_text_color(*DARK)

    def divider(self):
        self.set_draw_color(*LIGHT_BG)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(4)


# ── Public builders ───────────────────────────────────────────────────────────

def build_explain_pdf(data: dict) -> bytes:
    """PDF for POST /tutor/explain"""
    pdf = MedicalPDF("Medical Topic Explanation")

    pdf.section_title("Topic Overview")
    pdf.label_value("Topic",  data.get("topic", "—"))
    pdf.label_value("Level",  data.get("level", "—").capitalize())
    is_cached = data.get("cache_hit", False)
    pdf.badge("CACHE HIT" if is_cached else "CACHE MISS",
              SUCCESS if is_cached else SECONDARY)

    pdf.section_title("AI Explanation")
    pdf.body_text(data.get("explanation", "No explanation returned."))

    pdf.divider()
    pdf.label_value("AI Fallback", "No – real AI response" if not data.get("is_fallback") else "Yes")

    return bytes(pdf.output())


def build_ask_pdf(data: dict) -> bytes:
    """PDF for POST /tutor/ask"""
    pdf = MedicalPDF("RAG-Powered Medical Q&A")

    pdf.section_title("Question")
    pdf.body_text(data.get("question", "—"))

    pdf.section_title("AI Answer")
    pdf.body_text(data.get("answer", "No answer returned."))

    # Sources table
    sources = data.get("sources", [])
    if sources:
        pdf.section_title("Retrieved Knowledge Sources")
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_fill_color(*PRIMARY)
        pdf.set_text_color(*WHITE)
        pdf.set_x(12)
        pdf.cell(10,  7, "#",       fill=True, border=1)
        pdf.cell(40,  7, "Chunk ID", fill=True, border=1)
        pdf.cell(80,  7, "Topic",    fill=True, border=1)
        pdf.cell(56,  7, "Score",    fill=True, border=1, new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(*DARK)
        for i, src in enumerate(sources):
            pdf.set_fill_color(*LIGHT_BG if i % 2 == 0 else WHITE)
            pdf.set_x(12)
            pdf.cell(10,  6, str(i + 1),                 border=1, fill=True)
            pdf.cell(40,  6, str(src.get("id", "—")),    border=1, fill=True)
            pdf.cell(80,  6, str(src.get("topic", "—")), border=1, fill=True)
            pdf.cell(56,  6, str(round(src.get("score", 0), 3)), border=1, fill=True,
                     new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(4)

    pdf.divider()
    pdf.label_value("Cache Hit", "Yes" if data.get("cache_hit") else "No")
    pdf.label_value("AI Fallback", "No" if not data.get("is_fallback") else "Yes")

    return bytes(pdf.output())


def build_mcq_pdf(data: dict) -> bytes:
    """PDF for POST /generate-mcq"""
    pdf = MedicalPDF("Medical MCQ Examination Paper")

    pdf.section_title("Exam Details")
    pdf.label_value("Topic",       data.get("topic", "—"))
    pdf.label_value("Difficulty",  data.get("difficulty", "—").capitalize())
    pdf.label_value("Questions",   str(data.get("num_questions", 0)))
    pdf.ln(2)

    questions = data.get("questions", [])
    for q in questions:
        pdf.section_title(f"Question {q.get('id', '?')}")
        pdf.body_text(q.get("question", ""))

        opts = q.get("options", {})
        for key in ["A", "B", "C", "D"]:
            val = opts.get(key, "")
            if val:
                correct = q.get("correct_answer", "").upper() == key
                prefix = f"  {'[X]' if correct else '[ ]'}  {key}."
                pdf.set_font("Helvetica", "B" if correct else "", 9)
                pdf.set_text_color(*SUCCESS if correct else DARK)
                pdf.set_x(14)
                pdf.multi_cell(182, 5.5, f"{prefix}  {val}",
                               new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        # Explanation box
        pdf.ln(2)
        pdf.set_fill_color(240, 249, 255)
        pdf.set_draw_color(*SECONDARY)
        explanation = q.get("explanation", "")
        pdf.set_x(12)
        pdf.set_font("Helvetica", "I", 8)
        pdf.set_text_color(*SECONDARY)
        pdf.multi_cell(186, 5, f"  Explanation: {explanation}",
                       border=1, fill=True, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_text_color(*DARK)
        pdf.ln(4)

    return bytes(pdf.output())


def build_patient_pdf(data: dict) -> bytes:
    """PDF for POST /simulate-patient"""
    pdf = MedicalPDF("Patient Simulation Encounter")

    pdf.section_title("Session Details")
    pdf.label_value("Session ID",  data.get("session_id", "—"))
    pdf.label_value("Case Type",   data.get("case_type", "—").replace("_", " ").title())
    pdf.label_value("Turn Count",  str(data.get("turn_count", "—")))
    is_cached = data.get("cache_hit", False)
    pdf.badge("CACHE HIT" if is_cached else "CACHE MISS",
              SUCCESS if is_cached else SECONDARY)

    pdf.section_title("Patient Response")
    pdf.body_text(data.get("patient_response", "No response returned."))

    pdf.divider()
    pdf.label_value("AI Fallback", "No – real AI response" if not data.get("is_fallback") else "Yes")

    return bytes(pdf.output())


def build_rank_pdf(data: dict) -> bytes:
    """PDF for POST /predict-rank"""
    ORANGE = (234, 88, 12)   # orange-600
    PURPLE = (124, 58, 237)  # violet-600

    pdf = MedicalPDF("Student Rank Prediction Report")

    # ── Student Info ──────────────────────────────────────────────────────────
    pdf.section_title("Student Overview")
    pdf.label_value("Student ID",   data.get("student_id", "—"))
    pdf.label_value("Prediction",   data.get("combined_prediction", "—"))

    rule = data.get("rule_based", {})
    band = rule.get("performance_band", "—")
    band_colour = SUCCESS if band in ("Outstanding", "Excellent", "Good") else ORANGE
    pdf.badge(f"  {band}  ", band_colour)

    # ── Rule-Based Summary ────────────────────────────────────────────────────
    pdf.section_title("Rule-Based Analysis")
    pdf.label_value("Weighted Score",  f"{rule.get('weighted_score', 0):.1f} / 100")
    pdf.label_value("Percentile",      f"{rule.get('percentile', 0):.1f}th")
    pdf.label_value("Predicted Rank",
                    f"{rule.get('predicted_rank_min', 0):,}  –  {rule.get('predicted_rank_max', 0):,}")
    pdf.label_value("Weak Subjects",   ", ".join(rule.get("weak_subjects", [])) or "None")
    pdf.label_value("Strong Subjects", ", ".join(rule.get("strong_subjects", [])) or "None")
    pdf.ln(2)

    # ── Subject Breakdown Table ───────────────────────────────────────────────
    breakdown = rule.get("subject_breakdown", {})
    if breakdown:
        pdf.section_title("Subject-Wise Breakdown")
        pdf.set_font("Helvetica", "B", 8)
        pdf.set_fill_color(*PRIMARY)
        pdf.set_text_color(*WHITE)
        pdf.set_x(12)
        pdf.cell(60, 7, "Subject",   fill=True, border=1)
        pdf.cell(30, 7, "Score",     fill=True, border=1)
        pdf.cell(40, 7, "Weight %",  fill=True, border=1)
        pdf.cell(56, 7, "Status",    fill=True, border=1,
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_font("Helvetica", "", 8)
        for i, (subj, info) in enumerate(breakdown.items()):
            status = info.get("status", "Average")
            status_colour = (
                SUCCESS if status == "Strong"
                else ORANGE if status == "Weak"
                else DARK
            )
            fill_bg = LIGHT_BG if i % 2 == 0 else WHITE
            pdf.set_fill_color(*fill_bg)
            pdf.set_text_color(*DARK)
            pdf.set_x(12)
            pdf.cell(60, 6, subj.capitalize(),           border=1, fill=True)
            pdf.cell(30, 6, f"{info.get('score', 0)}/100", border=1, fill=True)
            pdf.cell(40, 6, str(info.get("weight_pct", "N/A")), border=1, fill=True)
            pdf.set_text_color(*status_colour)
            pdf.cell(56, 6, status,                       border=1, fill=True,
                     new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_text_color(*DARK)
        pdf.ln(4)

    # ── AI Analysis ───────────────────────────────────────────────────────────
    pdf.section_title("AI Inference & Recommendations")
    ai = data.get("ai_inference", {})
    analysis_text = ai.get("analysis", "No AI analysis available.")
    pdf.body_text(analysis_text)

    pdf.divider()
    pdf.label_value("AI Fallback", "No – real AI response" if not data.get("is_fallback") else "Yes")
    pdf.label_value("Cache Hit",   "Yes" if data.get("cache_hit") else "No")

    return bytes(pdf.output())
