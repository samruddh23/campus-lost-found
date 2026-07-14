from flask import current_app
from flask_mail import Message
from extensions import mail
from models import db, User, MatchNotification

def should_notify(confidence_percent, threshold):
    return confidence_percent >= threshold

def build_match_email(source_item, target_item, confidence_percent):
    subject = "Potential Lost/Found Match Detected!"
    body = (
        f"Hi,\n\n"
        f"We detected a potential match on Campus Lost & Found with a confidence score of {confidence_percent}%!\n\n"
        f"Source Item: {source_item.item_name} ({source_item.category})\n"
        f"Matched Item: {target_item.item_name} ({target_item.category})\n"
        f"Location: {target_item.location}\n\n"
        f"Please check the Campus Lost & Found app to review your potential match and coordinate return.\n\n"
        f"Best regards,\n"
        f"Campus Lost & Found Team"
    )
    return subject, body

def notify_match_if_needed(source_item, source_type, target_item, target_type, confidence_percent):
    threshold = current_app.config.get("MATCH_NOTIFY_THRESHOLD", 75.0)
    if not should_notify(confidence_percent, threshold):
        return False

    # Prevent self-notification
    if source_item.user_id == target_item.user_id:
        return False

    # Sort keys to deduplicate (source vs target bidirectional match)
    source_id, target_id = source_item.id, target_item.id
    if source_id < target_id:
        item1_id, item1_type = source_id, source_type
        item2_id, item2_type = target_id, target_type
    else:
        item1_id, item1_type = target_id, target_type
        item2_id, item2_type = source_id, source_type

    # Check deduplication DB record
    existing = MatchNotification.query.filter_by(
        source_item_id=item1_id,
        source_item_type=item1_type,
        target_item_id=item2_id,
        target_item_type=item2_type
    ).first()

    if existing:
        return False

    # Retrieve owner emails
    source_owner = db.session.get(User, source_item.user_id)
    target_owner = db.session.get(User, target_item.user_id)

    recipients = []
    if source_owner and source_owner.email:
        recipients.append(source_owner.email)
    if target_owner and target_owner.email:
        recipients.append(target_owner.email)

    if not recipients:
        current_app.logger.warning(
            f"Notification warning: No valid recipient emails found for match between {source_type} {source_id} and {target_type} {target_id}."
        )
        return False

    # Record notification in DB to prevent duplicates
    notif = MatchNotification(
        source_item_id=item1_id,
        source_item_type=item1_type,
        target_item_id=item2_id,
        target_item_type=item2_type
    )
    db.session.add(notif)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to save MatchNotification record: {e}")
        return False

    # Send email
    subject, body = build_match_email(source_item, target_item, confidence_percent)
    try:
        msg = Message(
            subject=subject,
            recipients=recipients,
            body=body
        )
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(
            f"Failed to send match email for {source_type} {source_id} & {target_type} {target_id} to {recipients}: {e}"
        )
        # Note: Do not raise, return False so calling endpoints do not crash
        return False
