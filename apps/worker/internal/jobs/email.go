package jobs

import (
	"encoding/json"
	"fmt"
	"html/template"
	"strings"

	"github.com/baaraco/baara/pkg/logger"
	"github.com/baaraco/baara/pkg/mailer"
	"go.uber.org/zap"
)

type EmailJob struct {
	Type      string `json:"type"`
	To        string `json:"to"`
	Name      string `json:"name"`
	EntryType string `json:"entry_type"`
}

type EmailProcessor struct {
	mailer mailer.Mailer
}

func NewEmailProcessor(m mailer.Mailer) *EmailProcessor {
	return &EmailProcessor{
		mailer: m,
	}
}

func (p *EmailProcessor) Process(data []byte) error {
	var job EmailJob
	if err := json.Unmarshal(data, &job); err != nil {
		return fmt.Errorf("failed to unmarshal email job: %w", err)
	}

	logger.Debug("Processing email job",
		zap.String("type", job.Type),
		zap.String("to", job.To),
	)

	switch job.Type {
	case "welcome":
		return p.sendWelcomeEmail(job)
	case "invitation":
		return p.sendInvitationEmail(job)
	default:
		return fmt.Errorf("unknown email job type: %s", job.Type)
	}
}

func (p *EmailProcessor) sendWelcomeEmail(job EmailJob) error {
	var subject, htmlBody, textBody string

	if job.EntryType == "recruiter" {
		subject = "Bienvenue sur Baara - Votre inscription est confirmée"
		htmlBody = p.renderRecruiterWelcome(job.Name)
		textBody = p.renderRecruiterWelcomeText(job.Name)
	} else {
		subject = "Bienvenue sur Baara - Votre inscription est confirmée"
		htmlBody = p.renderCandidateWelcome(job.Name)
		textBody = p.renderCandidateWelcomeText(job.Name)
	}

	if err := p.mailer.Send(job.To, subject, htmlBody, textBody); err != nil {
		return fmt.Errorf("failed to send welcome email: %w", err)
	}

	logger.Info("Welcome email sent",
		zap.String("to", job.To),
		zap.String("type", job.EntryType),
	)

	return nil
}

func (p *EmailProcessor) sendInvitationEmail(job EmailJob) error {
	subject := "Vous êtes invité à rejoindre Baara !"

	htmlBody := p.renderInvitation(job.Name)
	textBody := p.renderInvitationText(job.Name)

	if err := p.mailer.Send(job.To, subject, htmlBody, textBody); err != nil {
		return fmt.Errorf("failed to send invitation email: %w", err)
	}

	logger.Info("Invitation email sent",
		zap.String("to", job.To),
	)

	return nil
}

// Email templates
func (p *EmailProcessor) renderRecruiterWelcome(name string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 32px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 20px; }
        p { margin-bottom: 16px; }
        .highlight { background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 24px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Baara</div>
        </div>
        <h1>Bienvenue {{.Name}} !</h1>
        <p>Merci de vous être inscrit sur Baara. Votre demande d'accès au programme pilote a bien été enregistrée.</p>
        <div class="highlight">
            <strong>Prochaines étapes :</strong>
            <p>Notre équipe examine actuellement les demandes et vous contactera très prochainement pour vous donner accès à la plateforme.</p>
        </div>
        <p>En attendant, n'hésitez pas à nous contacter si vous avez des questions.</p>
        <p>À bientôt,<br>L'équipe Baara</p>
        <div class="footer">
            <p>Cet email a été envoyé par Baara.<br>
            Si vous n'avez pas demandé cet email, vous pouvez l'ignorer.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Name": name})
}

func (p *EmailProcessor) renderRecruiterWelcomeText(name string) string {
	return fmt.Sprintf(`Bienvenue %s !

Merci de vous être inscrit sur Baara. Votre demande d'accès au programme pilote a bien été enregistrée.

Prochaines étapes :
Notre équipe examine actuellement les demandes et vous contactera très prochainement pour vous donner accès à la plateforme.

En attendant, n'hésitez pas à nous contacter si vous avez des questions.

À bientôt,
L'équipe Baara
`, name)
}

func (p *EmailProcessor) renderCandidateWelcome(name string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 32px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 20px; }
        p { margin-bottom: 16px; }
        .highlight { background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 24px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Baara</div>
        </div>
        <h1>Bienvenue {{.Name}} !</h1>
        <p>Merci de rejoindre Baara. Votre inscription sur la liste d'attente a bien été enregistrée.</p>
        <div class="highlight">
            <strong>Ce qui vous attend :</strong>
            <p>Baara est une plateforme qui met en valeur votre travail, pas juste votre CV. Préparez vos meilleurs projets !</p>
        </div>
        <p>Nous vous contacterons dès qu'une place se libère.</p>
        <p>À très bientôt,<br>L'équipe Baara</p>
        <div class="footer">
            <p>Cet email a été envoyé par Baara.<br>
            Si vous n'avez pas demandé cet email, vous pouvez l'ignorer.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Name": name})
}

func (p *EmailProcessor) renderCandidateWelcomeText(name string) string {
	return fmt.Sprintf(`Bienvenue %s !

Merci de rejoindre Baara. Votre inscription sur la liste d'attente a bien été enregistrée.

Ce qui vous attend :
Baara est une plateforme qui met en valeur votre travail, pas juste votre CV. Préparez vos meilleurs projets !

Nous vous contacterons dès qu'une place se libère.

À très bientôt,
L'équipe Baara
`, name)
}

func (p *EmailProcessor) renderInvitation(name string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 32px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 20px; }
        p { margin-bottom: 16px; }
        .cta { display: inline-block; background: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Baara</div>
        </div>
        <h1>{{.Name}}, c'est votre tour !</h1>
        <p>Bonne nouvelle ! Une place s'est libérée sur Baara et nous sommes ravis de vous inviter à rejoindre la plateforme.</p>
        <p style="text-align: center; margin: 32px 0;">
            <a href="https://baara.co/signup" class="cta">Créer mon compte</a>
        </p>
        <p>Cette invitation est valable pendant 7 jours.</p>
        <p>À très bientôt sur Baara !</p>
        <div class="footer">
            <p>Cet email a été envoyé par Baara.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Name": name})
}

func (p *EmailProcessor) renderInvitationText(name string) string {
	return fmt.Sprintf(`%s, c'est votre tour !

Bonne nouvelle ! Une place s'est libérée sur Baara et nous sommes ravis de vous inviter à rejoindre la plateforme.

Créez votre compte : https://baara.co/signup

Cette invitation est valable pendant 7 jours.

À très bientôt sur Baara !
`, name)
}

func renderTemplate(tmpl string, data map[string]string) string {
	t, err := template.New("email").Parse(tmpl)
	if err != nil {
		return tmpl
	}
	var buf strings.Builder
	if err := t.Execute(&buf, data); err != nil {
		return tmpl
	}
	return buf.String()
}
