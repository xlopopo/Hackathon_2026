from typing import Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body: str) -> bool:
    """
    Отправка email. 
    Если MAIL настройки не заданы — просто логируем.
    """
    from app.core.config import settings

    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        # Режим разработки — просто выводим в лог
        logger.info(f"[EMAIL DEV MODE] To: {to}")
        logger.info(f"[EMAIL DEV MODE] Subject: {subject}")
        logger.info(f"[EMAIL DEV MODE] Body: {body}")
        print(f"\n{'='*50}")
        print(f"📧 EMAIL (dev mode)")
        print(f"To: {to}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body}")
        print(f"{'='*50}\n")
        return True

    try:
        from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

        conf = ConnectionConfig(
            MAIL_USERNAME=settings.MAIL_USERNAME,
            MAIL_PASSWORD=settings.MAIL_PASSWORD,
            MAIL_FROM=settings.MAIL_FROM,
            MAIL_PORT=settings.MAIL_PORT,
            MAIL_SERVER=settings.MAIL_SERVER,
            MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
        )

        message = MessageSchema(
            subject=subject,
            recipients=[to],
            body=body,
            subtype=MessageType.html,
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        logger.info(f"Email отправлен: {to}")
        return True

    except Exception as e:
        logger.error(f"Ошибка отправки email на {to}: {e}")
        return False


async def send_access_expiring_notification(
    psychologist_email: str,
    psychologist_name: str,
    admin_email: str,
    access_until: datetime,
    days_left: int,
) -> None:
    """Уведомление об истечении подписки — психологу и админу."""

    expire_date = access_until.strftime('%d.%m.%Y')

    # Письмо психологу
    psychologist_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0369a1, #0d9488); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ПрофДНК</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1e293b;">Здравствуйте, {psychologist_name}!</h2>
            <p style="color: #64748b; line-height: 1.6;">
                Уведомляем вас, что срок вашего доступа к платформе <strong>ПрофДНК</strong> 
                истекает <strong style="color: #ef4444;">{expire_date}</strong> 
                (через <strong>{days_left} дн.</strong>).
            </p>
            <div style="background: #fef9c3; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                    ⚠️ После истечения срока доступ к системе будет ограничен.
                    Обратитесь к администратору для продления.
                </p>
            </div>
            <p style="color: #64748b;">
                С уважением,<br>
                <strong>Команда ПрофДНК</strong>
            </p>
        </div>
    </body>
    </html>
    """

    # Письмо админу
    admin_body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0369a1, #0d9488); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ПрофДНК — Уведомление</h1>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1e293b;">Истекает подписка психолога</h2>
            <p style="color: #64748b; line-height: 1.6;">
                У психолога <strong>{psychologist_name}</strong> ({psychologist_email}) 
                заканчивается доступ к платформе.
            </p>
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; color: #1e293b;">
                    📅 Дата окончания: <strong style="color: #ef4444;">{expire_date}</strong><br>
                    ⏳ Осталось дней: <strong>{days_left}</strong>
                </p>
            </div>
            <p style="color: #64748b;">
                Войдите в панель администратора для продления доступа.
            </p>
        </div>
    </body>
    </html>
    """

    await send_email(
        to=psychologist_email,
        subject=f"⚠️ Истекает доступ к ПрофДНК — {expire_date}",
        body=psychologist_body,
    )

    await send_email(
        to=admin_email,
        subject=f"⚠️ У психолога {psychologist_name} истекает доступ — {expire_date}",
        body=admin_body,
    )


async def send_report_to_client(
    client_email: str,
    client_name: str,
    psychologist_name: str,
    test_title: str,
    report_html: str,
) -> bool:
    """Отправка отчёта клиенту от психолога."""

    body = f"""
    <html>
    <body style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0369a1, #0d9488); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">ПрофДНК</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0;">Результаты тестирования</p>
        </div>
        <div style="background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1e293b;">Здравствуйте, {client_name}!</h2>
            <p style="color: #64748b; line-height: 1.6;">
                Психолог <strong>{psychologist_name}</strong> подготовил результаты 
                вашего тестирования <strong>«{test_title}»</strong>.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            {report_html}
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
            <p style="color: #94a3b8; font-size: 0.85rem;">
                Это письмо отправлено автоматически платформой ПрофДНК.
            </p>
        </div>
    </body>
    </html>
    """

    return await send_email(
        to=client_email,
        subject=f"Результаты тестирования «{test_title}» — ПрофДНК",
        body=body,
    )