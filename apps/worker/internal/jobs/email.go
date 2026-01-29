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

// =============================================================================
// JOB TYPES
// =============================================================================

// CandidateEmailJob for candidate-related emails
type CandidateEmailJob struct {
	Type   string `json:"type"`
	To     string `json:"to"`
	Name   string `json:"name"`
	Locale string `json:"locale"`
}

// PilotNotificationJob for pilot request emails
type PilotNotificationJob struct {
	Type       string `json:"type"`
	PilotID    string `json:"pilot_id"`
	Email      string `json:"email"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Company    string `json:"company"`
	RoleToHire string `json:"role_to_hire"`
	Locale     string `json:"locale"`
}

// ProofProfileCandidateEmailJob for notifying candidates their proof profile is ready
type ProofProfileCandidateEmailJob struct {
	Type           string `json:"type"`
	To             string `json:"to"`
	Name           string `json:"name"`
	CandidateID    string `json:"candidate_id"`
	ProofProfileID string `json:"proof_profile_id"`
}

// ProofProfileRecruiterEmailJob for notifying recruiters about a new proof profile
type ProofProfileRecruiterEmailJob struct {
	Type           string `json:"type"`
	To             string `json:"to"`
	Name           string `json:"name"`
	CandidateName  string `json:"candidate_name"`
	CandidateID    string `json:"candidate_id"`
	JobID          string `json:"job_id"`
	ProofProfileID string `json:"proof_profile_id"`
}

// =============================================================================
// PROCESSOR
// =============================================================================

type EmailProcessor struct {
	mailer mailer.Mailer
}

func NewEmailProcessor(m mailer.Mailer) *EmailProcessor {
	return &EmailProcessor{
		mailer: m,
	}
}

func (p *EmailProcessor) Process(data []byte) error {
	// First, check the job type
	var baseJob struct {
		Type string `json:"type"`
	}
	if err := json.Unmarshal(data, &baseJob); err != nil {
		return fmt.Errorf("failed to unmarshal job type: %w", err)
	}

	logger.Debug("Processing job",
		zap.String("type", baseJob.Type),
	)

	switch baseJob.Type {
	case "candidate_welcome":
		var job CandidateEmailJob
		if err := json.Unmarshal(data, &job); err != nil {
			return fmt.Errorf("failed to unmarshal candidate email job: %w", err)
		}
		return p.sendCandidateWelcomeEmail(job)

	case "candidate_invitation":
		var job CandidateEmailJob
		if err := json.Unmarshal(data, &job); err != nil {
			return fmt.Errorf("failed to unmarshal candidate email job: %w", err)
		}
		return p.sendCandidateInvitationEmail(job)

	case "pilot_complete":
		var job PilotNotificationJob
		if err := json.Unmarshal(data, &job); err != nil {
			return fmt.Errorf("failed to unmarshal pilot job: %w", err)
		}
		return p.sendPilotCompleteEmail(job)

	case "proof_profile_ready_candidate":
		var job ProofProfileCandidateEmailJob
		if err := json.Unmarshal(data, &job); err != nil {
			return fmt.Errorf("failed to unmarshal proof profile candidate email job: %w", err)
		}
		return p.sendProofProfileReadyCandidateEmail(job)

	case "proof_profile_ready_recruiter":
		var job ProofProfileRecruiterEmailJob
		if err := json.Unmarshal(data, &job); err != nil {
			return fmt.Errorf("failed to unmarshal proof profile recruiter email job: %w", err)
		}
		return p.sendProofProfileReadyRecruiterEmail(job)

	default:
		return fmt.Errorf("unknown job type: %s", baseJob.Type)
	}
}

// =============================================================================
// CANDIDATE EMAILS
// =============================================================================

func (p *EmailProcessor) sendCandidateWelcomeEmail(job CandidateEmailJob) error {
	var subject, htmlBody, textBody string

	if job.Locale == "en" {
		subject = "Welcome to Baara - Registration confirmed"
		htmlBody = p.renderCandidateWelcomeEN(job.Name)
		textBody = p.renderCandidateWelcomeTextEN(job.Name)
	} else {
		subject = "Bienvenue sur Baara - Inscription confirmée"
		htmlBody = p.renderCandidateWelcomeFR(job.Name)
		textBody = p.renderCandidateWelcomeTextFR(job.Name)
	}

	if err := p.mailer.Send(job.To, subject, htmlBody, textBody); err != nil {
		return fmt.Errorf("failed to send candidate welcome email: %w", err)
	}

	logger.Info("Candidate welcome email sent",
		zap.String("to", job.To),
	)

	return nil
}

func (p *EmailProcessor) sendCandidateInvitationEmail(job CandidateEmailJob) error {
	var subject, htmlBody, textBody string

	if job.Locale == "en" {
		subject = "You're invited to join Baara!"
		htmlBody = p.renderCandidateInvitationEN(job.Name)
		textBody = p.renderCandidateInvitationTextEN(job.Name)
	} else {
		subject = "Vous êtes invité à rejoindre Baara !"
		htmlBody = p.renderCandidateInvitationFR(job.Name)
		textBody = p.renderCandidateInvitationTextFR(job.Name)
	}

	if err := p.mailer.Send(job.To, subject, htmlBody, textBody); err != nil {
		return fmt.Errorf("failed to send candidate invitation email: %w", err)
	}

	logger.Info("Candidate invitation email sent",
		zap.String("to", job.To),
	)

	return nil
}

// Candidate Welcome Templates - FR
func (p *EmailProcessor) renderCandidateWelcomeFR(name string) string {
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
        <p>Merci de rejoindre Baara. Votre inscription a bien été enregistrée.</p>
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

func (p *EmailProcessor) renderCandidateWelcomeTextFR(name string) string {
	return fmt.Sprintf(`Bienvenue %s !

Merci de rejoindre Baara. Votre inscription a bien été enregistrée.

Ce qui vous attend :
Baara est une plateforme qui met en valeur votre travail, pas juste votre CV. Préparez vos meilleurs projets !

Nous vous contacterons dès qu'une place se libère.

À très bientôt,
L'équipe Baara
`, name)
}

// Candidate Welcome Templates - EN
func (p *EmailProcessor) renderCandidateWelcomeEN(name string) string {
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
        <h1>Welcome {{.Name}}!</h1>
        <p>Thanks for joining Baara. Your registration has been confirmed.</p>
        <div class="highlight">
            <strong>What's next:</strong>
            <p>Baara is a platform that showcases your work, not just your resume. Get your best projects ready!</p>
        </div>
        <p>We'll contact you as soon as a spot opens up.</p>
        <p>Talk soon,<br>The Baara team</p>
        <div class="footer">
            <p>This email was sent by Baara.<br>
            If you didn't request this email, you can ignore it.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Name": name})
}

func (p *EmailProcessor) renderCandidateWelcomeTextEN(name string) string {
	return fmt.Sprintf(`Welcome %s!

Thanks for joining Baara. Your registration has been confirmed.

What's next:
Baara is a platform that showcases your work, not just your resume. Get your best projects ready!

We'll contact you as soon as a spot opens up.

Talk soon,
The Baara team
`, name)
}

// Candidate Invitation Templates - FR
func (p *EmailProcessor) renderCandidateInvitationFR(name string) string {
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

func (p *EmailProcessor) renderCandidateInvitationTextFR(name string) string {
	return fmt.Sprintf(`%s, c'est votre tour !

Bonne nouvelle ! Une place s'est libérée sur Baara et nous sommes ravis de vous inviter à rejoindre la plateforme.

Créez votre compte : https://baara.co/signup

Cette invitation est valable pendant 7 jours.

À très bientôt sur Baara !
`, name)
}

// Candidate Invitation Templates - EN
func (p *EmailProcessor) renderCandidateInvitationEN(name string) string {
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
        <h1>{{.Name}}, it's your turn!</h1>
        <p>Great news! A spot has opened up on Baara and we're excited to invite you to join the platform.</p>
        <p style="text-align: center; margin: 32px 0;">
            <a href="https://baara.co/signup" class="cta">Create my account</a>
        </p>
        <p>This invitation is valid for 7 days.</p>
        <p>See you soon on Baara!</p>
        <div class="footer">
            <p>This email was sent by Baara.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Name": name})
}

func (p *EmailProcessor) renderCandidateInvitationTextEN(name string) string {
	return fmt.Sprintf(`%s, it's your turn!

Great news! A spot has opened up on Baara and we're excited to invite you to join the platform.

Create your account: https://baara.co/signup

This invitation is valid for 7 days.

See you soon on Baara!
`, name)
}

// =============================================================================
// PILOT EMAILS
// =============================================================================

func (p *EmailProcessor) sendPilotCompleteEmail(job PilotNotificationJob) error {
	fullName := job.FirstName + " " + job.LastName

	// Send confirmation to the requester
	var subject, htmlBody, textBody string
	if job.Locale == "en" {
		subject = "Pilot request received - Baara"
		htmlBody = p.renderPilotConfirmationEN(job)
		textBody = p.renderPilotConfirmationTextEN(job)
	} else {
		subject = "Demande de pilote reçue - Baara"
		htmlBody = p.renderPilotConfirmationFR(job)
		textBody = p.renderPilotConfirmationTextFR(job)
	}

	if err := p.mailer.Send(job.Email, subject, htmlBody, textBody); err != nil {
		return fmt.Errorf("failed to send pilot confirmation email: %w", err)
	}

	logger.Info("Pilot confirmation email sent",
		zap.String("to", job.Email),
		zap.String("pilot_id", job.PilotID),
	)

	// Send internal notification to team
	internalSubject := fmt.Sprintf("[Pilot] Nouvelle demande: %s - %s", job.Company, job.RoleToHire)
	internalBody := p.renderPilotInternalNotification(job)
	internalText := p.renderPilotInternalNotificationText(job)

	// TODO: Configure team notification email from env
	teamEmail := "team@baara.co"
	if err := p.mailer.Send(teamEmail, internalSubject, internalBody, internalText); err != nil {
		logger.Error("Failed to send internal pilot notification",
			zap.String("pilot_id", job.PilotID),
			zap.Error(err),
		)
		// Don't return error - the user confirmation was sent successfully
	} else {
		logger.Info("Internal pilot notification sent",
			zap.String("pilot_id", job.PilotID),
			zap.String("company", job.Company),
			zap.String("name", fullName),
		)
	}

	return nil
}

// Pilot Confirmation Templates - FR
func (p *EmailProcessor) renderPilotConfirmationFR(job PilotNotificationJob) string {
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
        .check-item { display: flex; align-items: flex-start; margin-bottom: 12px; }
        .check { color: #0066cc; margin-right: 10px; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Baara</div>
        </div>
        <h1>Merci {{.FirstName}} !</h1>
        <p>Votre demande de pilote pour <strong>{{.Company}}</strong> a bien été reçue.</p>
        <div class="highlight">
            <strong>On revient vers vous sous 48h avec :</strong>
            <div style="margin-top: 12px;">
                <div class="check-item"><span class="check">✓</span> Cadrage du pilote</div>
                <div class="check-item"><span class="check">✓</span> KPIs à mesurer</div>
                <div class="check-item"><span class="check">✓</span> Proposition détaillée</div>
            </div>
        </div>
        <p>Poste recherché : <strong>{{.RoleToHire}}</strong></p>
        <p>En attendant, n'hésitez pas à répondre à cet email si vous avez des questions.</p>
        <p>À très bientôt,<br>L'équipe Baara</p>
        <div class="footer">
            <p>Cet email a été envoyé par Baara suite à votre demande de pilote.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{
		"FirstName":  job.FirstName,
		"Company":    job.Company,
		"RoleToHire": job.RoleToHire,
	})
}

func (p *EmailProcessor) renderPilotConfirmationTextFR(job PilotNotificationJob) string {
	return fmt.Sprintf(`Merci %s !

Votre demande de pilote pour %s a bien été reçue.

On revient vers vous sous 48h avec :
✓ Cadrage du pilote
✓ KPIs à mesurer
✓ Proposition détaillée

Poste recherché : %s

En attendant, n'hésitez pas à répondre à cet email si vous avez des questions.

À très bientôt,
L'équipe Baara
`, job.FirstName, job.Company, job.RoleToHire)
}

// Pilot Confirmation Templates - EN
func (p *EmailProcessor) renderPilotConfirmationEN(job PilotNotificationJob) string {
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
        .check-item { display: flex; align-items: flex-start; margin-bottom: 12px; }
        .check { color: #0066cc; margin-right: 10px; font-weight: bold; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Baara</div>
        </div>
        <h1>Thank you {{.FirstName}}!</h1>
        <p>Your pilot request for <strong>{{.Company}}</strong> has been received.</p>
        <div class="highlight">
            <strong>We'll get back to you within 48h with:</strong>
            <div style="margin-top: 12px;">
                <div class="check-item"><span class="check">✓</span> Pilot scoping</div>
                <div class="check-item"><span class="check">✓</span> KPIs to measure</div>
                <div class="check-item"><span class="check">✓</span> Detailed proposal</div>
            </div>
        </div>
        <p>Position to fill: <strong>{{.RoleToHire}}</strong></p>
        <p>In the meantime, feel free to reply to this email if you have any questions.</p>
        <p>Talk soon,<br>The Baara team</p>
        <div class="footer">
            <p>This email was sent by Baara following your pilot request.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{
		"FirstName":  job.FirstName,
		"Company":    job.Company,
		"RoleToHire": job.RoleToHire,
	})
}

func (p *EmailProcessor) renderPilotConfirmationTextEN(job PilotNotificationJob) string {
	return fmt.Sprintf(`Thank you %s!

Your pilot request for %s has been received.

We'll get back to you within 48h with:
✓ Pilot scoping
✓ KPIs to measure
✓ Detailed proposal

Position to fill: %s

In the meantime, feel free to reply to this email if you have any questions.

Talk soon,
The Baara team
`, job.FirstName, job.Company, job.RoleToHire)
}

// Pilot Internal Notification
func (p *EmailProcessor) renderPilotInternalNotification(job PilotNotificationJob) string {
	fullName := job.FirstName + " " + job.LastName
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 20px; }
        .info { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 24px 0; }
        .info-row { margin-bottom: 8px; }
        .label { font-weight: 600; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎯 Nouvelle demande de pilote</h1>
        <div class="info">
            <div class="info-row"><span class="label">ID:</span> {{.PilotID}}</div>
            <div class="info-row"><span class="label">Nom:</span> {{.FullName}}</div>
            <div class="info-row"><span class="label">Email:</span> {{.Email}}</div>
            <div class="info-row"><span class="label">Entreprise:</span> {{.Company}}</div>
            <div class="info-row"><span class="label">Rôle recherché:</span> {{.RoleToHire}}</div>
            <div class="info-row"><span class="label">Langue:</span> {{.Locale}}</div>
        </div>
        <p>→ Répondre sous 48h</p>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{
		"PilotID":    job.PilotID,
		"FullName":   fullName,
		"Email":      job.Email,
		"Company":    job.Company,
		"RoleToHire": job.RoleToHire,
		"Locale":     job.Locale,
	})
}

func (p *EmailProcessor) renderPilotInternalNotificationText(job PilotNotificationJob) string {
	fullName := job.FirstName + " " + job.LastName
	return fmt.Sprintf(`🎯 Nouvelle demande de pilote

ID: %s
Nom: %s
Email: %s
Entreprise: %s
Rôle recherché: %s
Langue: %s

→ Répondre sous 48h
`, job.PilotID, fullName, job.Email, job.Company, job.RoleToHire, job.Locale)
}

// =============================================================================
// PROOF PROFILE EMAILS
// =============================================================================

func (p *EmailProcessor) sendProofProfileReadyCandidateEmail(job ProofProfileCandidateEmailJob) error {
	subject := "Votre Proof Profile est prêt - Baara"
	htmlBody := p.renderProofProfileCandidateHTML(job.Name)
	textBody := p.renderProofProfileCandidateText(job.Name)

	if err := p.mailer.Send(job.To, subject, htmlBody, textBody); err != nil {
		return fmt.Errorf("failed to send proof profile candidate email: %w", err)
	}

	logger.Info("Proof profile candidate email sent",
		zap.String("to", job.To),
		zap.String("proof_profile_id", job.ProofProfileID),
	)

	return nil
}

func (p *EmailProcessor) sendProofProfileReadyRecruiterEmail(job ProofProfileRecruiterEmailJob) error {
	subject := fmt.Sprintf("Nouveau Proof Profile pour %s - Baara", job.CandidateName)
	htmlBody := p.renderProofProfileRecruiterHTML(job.Name, job.CandidateName)
	textBody := p.renderProofProfileRecruiterText(job.Name, job.CandidateName)

	if err := p.mailer.Send(job.To, subject, htmlBody, textBody); err != nil {
		return fmt.Errorf("failed to send proof profile recruiter email: %w", err)
	}

	logger.Info("Proof profile recruiter email sent",
		zap.String("to", job.To),
		zap.String("proof_profile_id", job.ProofProfileID),
	)

	return nil
}

func (p *EmailProcessor) renderProofProfileCandidateHTML(name string) string {
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
        .cta { display: inline-block; background: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Baara</div>
        </div>
        <h1>{{.Name}}, votre Proof Profile est prêt !</h1>
        <p>Bonne nouvelle ! Votre travail a été évalué et votre Proof Profile est maintenant disponible.</p>
        <div class="highlight">
            <strong>Votre Proof Profile contient :</strong>
            <ul>
                <li>Votre score global et par critère</li>
                <li>Vos points forts identifiés</li>
                <li>Les axes d'amélioration</li>
            </ul>
        </div>
        <p style="text-align: center; margin: 32px 0;">
            <a href="https://baara.co/app/proof-profile" class="cta">Voir mon Proof Profile</a>
        </p>
        <p>Votre Proof Profile est un atout pour montrer vos compétences aux recruteurs.</p>
        <p>À très bientôt,<br>L'équipe Baara</p>
        <div class="footer">
            <p>Cet email a été envoyé par Baara.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Name": name})
}

func (p *EmailProcessor) renderProofProfileCandidateText(name string) string {
	return fmt.Sprintf(`%s, votre Proof Profile est prêt !

Bonne nouvelle ! Votre travail a été évalué et votre Proof Profile est maintenant disponible.

Votre Proof Profile contient :
- Votre score global et par critère
- Vos points forts identifiés
- Les axes d'amélioration

Voir votre Proof Profile : https://baara.co/app/proof-profile

Votre Proof Profile est un atout pour montrer vos compétences aux recruteurs.

À très bientôt,
L'équipe Baara
`, name)
}

func (p *EmailProcessor) renderProofProfileRecruiterHTML(recruiterName, candidateName string) string {
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
        .cta { display: inline-block; background: #0066cc; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 14px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Baara</div>
        </div>
        <h1>Nouveau Proof Profile disponible</h1>
        <p>Bonjour {{.RecruiterName}},</p>
        <p>Un nouveau Proof Profile est disponible pour <strong>{{.CandidateName}}</strong>.</p>
        <div class="highlight">
            <strong>Le Proof Profile vous permet de :</strong>
            <ul>
                <li>Voir le score global et par critère du candidat</li>
                <li>Identifier les points forts et les zones d'ombre</li>
                <li>Préparer votre entretien avec des questions suggérées</li>
            </ul>
        </div>
        <p style="text-align: center; margin: 32px 0;">
            <a href="https://baara.co/app/dashboard" class="cta">Voir le Proof Profile</a>
        </p>
        <p>À très bientôt,<br>L'équipe Baara</p>
        <div class="footer">
            <p>Cet email a été envoyé par Baara.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{
		"RecruiterName": recruiterName,
		"CandidateName": candidateName,
	})
}

func (p *EmailProcessor) renderProofProfileRecruiterText(recruiterName, candidateName string) string {
	return fmt.Sprintf(`Nouveau Proof Profile disponible

Bonjour %s,

Un nouveau Proof Profile est disponible pour %s.

Le Proof Profile vous permet de :
- Voir le score global et par critère du candidat
- Identifier les points forts et les zones d'ombre
- Préparer votre entretien avec des questions suggérées

Voir le Proof Profile : https://baara.co/app/dashboard

À très bientôt,
L'équipe Baara
`, recruiterName, candidateName)
}

// =============================================================================
// HELPERS
// =============================================================================

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
