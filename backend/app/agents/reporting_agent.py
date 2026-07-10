import json

from sqlalchemy.orm import Session

from app.models.audit import AuditResult
from app.models.report import Report
from app.utils.scoring import readiness_label, safety_score_from_risks


def generate_report(db: Session, audit_run_id: int) -> Report:
    results = db.query(AuditResult).filter(AuditResult.audit_run_id == audit_run_id).all()
    risk_scores = [result.risk_score for result in results]
    overall_score = safety_score_from_risks(risk_scores)
    counts: dict[str, int] = {}
    for result in results:
        counts[result.label] = counts.get(result.label, 0) + 1

    summary = {
        "total_results": len(results),
        "label_counts": counts,
        "overall_safety_score": overall_score,
        "readiness_label": readiness_label(overall_score),
    }

    report = db.query(Report).filter(Report.audit_run_id == audit_run_id).first()
    if report is None:
        report = Report(audit_run_id=audit_run_id)
        db.add(report)

    report.overall_safety_score = overall_score
    report.readiness_label = readiness_label(overall_score)
    report.summary_json = json.dumps(summary)
    db.commit()
    db.refresh(report)
    return report
