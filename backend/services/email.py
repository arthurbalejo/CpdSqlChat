import os
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

MAIL_EMAIL = os.getenv("MAIL_EMAIL")
MAIL_SENHA = os.getenv("MAIL_SENHA")

async def enviar_email_recuperacao(destinatario: str, token: str):
    link = f"http://localhost:3000/resetar-senha?token={token}"

    mensagem = MIMEMultipart("alternative")
    mensagem["Subject"] = "BEE IA — Recuperação de senha"
    mensagem["From"] = MAIL_EMAIL
    mensagem["To"] = destinatario

    html = f"""
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background-color: #1a2d4a; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 20px;">BEE IA</h1>
        <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">
          Assistente de Evasão — UFSM
        </p>
      </div>
      <div style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
        <p style="color: #1a2d4a; font-size: 14px;">Você solicitou a recuperação de senha.</p>
        <p style="color: #1a2d4a; font-size: 14px;">Clique no botão abaixo para criar uma nova senha:</p>
        <a href="{link}"
           style="display: inline-block; background-color: #f97316; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; font-size: 14px; margin: 16px 0;">
          Resetar minha senha
        </a>
        <p style="color: #64748b; font-size: 12px;">
          Este link expira em 1 hora. Se você não solicitou isso, ignore este email.
        </p>
        <p style="color: #94a3b8; font-size: 11px; margin-top: 16px;">
          Ou copie o token: <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">{token}</code>
        </p>
      </div>
    </div>
    """

    mensagem.attach(MIMEText(html, "html"))

    await aiosmtplib.send(
        mensagem,
        hostname="smtp.gmail.com",
        port=465,
        use_tls=True,
        username=MAIL_EMAIL,
        password=MAIL_SENHA,
    )