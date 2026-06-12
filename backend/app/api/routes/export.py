from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
import pandas as pd
import io
from datetime import datetime

from backend.app.api.deps import require_api_key
from backend.app.api.routes.chat import get_pipeline

router = APIRouter(prefix="/export", tags=["export"])

class ExportRequest(BaseModel):
    question: str
    session_id: str = "default"
    format: str = "csv"   # csv | excel | pdf

@router.post("/csv")
async def export_csv(req: ExportRequest, _=Depends(require_api_key)):
    pipeline = get_pipeline()
    _, _, df, success, error = pipeline.run(req.question)
    if not success:
        raise HTTPException(status_code=500, detail=error)
    csv_bytes = df.to_csv(index=False).encode("utf-8")
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=trackerwave_export.csv"},
    )

@router.post("/excel")
async def export_excel(req: ExportRequest, _=Depends(require_api_key)):
    pipeline = get_pipeline()
    _, _, df, success, error = pipeline.run(req.question)
    if not success:
        raise HTTPException(status_code=500, detail=error)
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="TrackerWave Export")
    buf.seek(0)
    return Response(
        content=buf.read(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=trackerwave_export.xlsx"},
    )

@router.post("/pdf")
async def export_pdf(req: ExportRequest, _=Depends(require_api_key)):
    pipeline = get_pipeline()
    _, intent, df, success, error = pipeline.run(req.question)
    if not success:
        raise HTTPException(status_code=500, detail=error)
    summary = pipeline.generate_summary(req.question, df, intent)
    
    # Generate PDF using reportlab since weasyprint is heavy
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import letter, landscape
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(letter), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle('TitleStyle', parent=styles['Heading1'], textColor=colors.HexColor('#2C3687'))
    subtitle_style = ParagraphStyle('SubtitleStyle', parent=styles['Heading2'], textColor=colors.HexColor('#28A5A0'))
    normal_style = styles['Normal']
    
    elements.append(Paragraph("TrackerWave Analytics Report", title_style))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')} IST", normal_style))
    elements.append(Spacer(1, 12))
    
    elements.append(Paragraph("Query", subtitle_style))
    elements.append(Paragraph(req.question, normal_style))
    elements.append(Spacer(1, 12))
    
    elements.append(Paragraph("Summary", subtitle_style))
    elements.append(Paragraph(summary, normal_style))
    elements.append(Spacer(1, 20))
    
    elements.append(Paragraph(f"Data ({len(df)} rows — showing first 50)", subtitle_style))
    elements.append(Spacer(1, 10))
    
    # Data Table
    table_data = [df.columns.tolist()]
    for row in df.head(50).values.tolist():
        # Convert any non-string items to strings to prevent reportlab errors
        table_data.append([str(item)[:50] + "..." if len(str(item)) > 50 else str(item) for item in row])
    
    t = Table(table_data)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2C3687')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F0FDFB')]),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(t)
    
    doc.build(elements)
    buf.seek(0)
    
    return Response(
        content=buf.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=trackerwave_report.pdf"},
    )
