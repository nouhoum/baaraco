package auth

import (
	"fmt"
	"html/template"
	"os"
	"strings"

	"github.com/baaraco/baara/pkg/mailer"
	"github.com/baaraco/baara/pkg/models"
)

// EmailService handles auth-related emails
type EmailService struct {
	mailer mailer.Mailer
	appURL string
}

// NewEmailService creates a new auth email service
func NewEmailService(m mailer.Mailer) *EmailService {
	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "http://localhost:3000"
	}
	return &EmailService{
		mailer: m,
		appURL: appURL,
	}
}

// SendMagicLink sends a magic link email for login
//
//nolint:misspell // false positive
func (s *EmailService) SendMagicLink(email, token string, isNewUser bool, locale string) error {
	link := fmt.Sprintf("%s/auth/callback?token=%s", s.appURL, token)

	var subject, htmlBody, textBody string

	if isNewUser {
		if locale == "en" {
			subject = "Welcome to Baara — Create your Proof Profile"
			htmlBody = s.renderWelcomeEmailEN(link)
			textBody = s.renderWelcomeEmailTextEN(link)
		} else {
			subject = "Bienvenue sur Baara — Créez votre Proof Profile"
			htmlBody = s.renderWelcomeEmailFR(link)
			textBody = s.renderWelcomeEmailTextFR(link)
		}
	} else {
		if locale == "en" {
			subject = "Your Baara login link"
			htmlBody = s.renderLoginEmailEN(link)
			textBody = s.renderLoginEmailTextEN(link)
		} else {
			subject = "Votre lien de connexion Baara"
			htmlBody = s.renderLoginEmailFR(link)
			textBody = s.renderLoginEmailTextFR(link)
		}
	}

	return s.mailer.Send(email, subject, htmlBody, textBody)
}

// SendRecruiterInvite sends an invitation email to a recruiter
func (s *EmailService) SendRecruiterInvite(email, token string, org *models.Org, locale string) error {
	link := fmt.Sprintf("%s/invites/accept?token=%s", s.appURL, token)

	var subject, htmlBody, textBody string

	if locale == "en" {
		subject = "Welcome to Baara — Activate your account"
		htmlBody = s.renderRecruiterInviteEN(link, org.Name)
		textBody = s.renderRecruiterInviteTextEN(link, org.Name)
	} else {
		subject = "Bienvenue sur Baara — Activez votre compte"
		htmlBody = s.renderRecruiterInviteFR(link, org.Name)
		textBody = s.renderRecruiterInviteTextFR(link, org.Name)
	}

	return s.mailer.Send(email, subject, htmlBody, textBody)
}

// SendCandidateInvite sends an invitation email to a candidate
func (s *EmailService) SendCandidateInvite(email, token string, org *models.Org, job *models.Job, locale string) error {
	link := fmt.Sprintf("%s/invites/accept?token=%s", s.appURL, token)

	orgName := "Baara"
	if org != nil {
		orgName = org.Name
	}

	jobTitle := "une évaluation"
	if job != nil {
		jobTitle = job.Title
	}

	var subject, htmlBody, textBody string

	if locale == "en" {
		subject = fmt.Sprintf("%s invites you to complete an assessment for %s", orgName, jobTitle)
		htmlBody = s.renderCandidateInviteEN(link, orgName, jobTitle)
		textBody = s.renderCandidateInviteTextEN(link, orgName, jobTitle)
	} else {
		subject = fmt.Sprintf("%s vous invite à compléter une évaluation pour %s", orgName, jobTitle)
		htmlBody = s.renderCandidateInviteFR(link, orgName, jobTitle)
		textBody = s.renderCandidateInviteTextFR(link, orgName, jobTitle)
	}

	return s.mailer.Send(email, subject, htmlBody, textBody)
}

// Email templates

func (s *EmailService) renderLoginEmailFR(link string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { margin-bottom: 16px; color: #4a4a4a; }
        .cta { display: block; background: #0066cc; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 32px 0; }
        .cta:hover { background: #0052a3; }
        .note { font-size: 14px; color: #888; text-align: center; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Baara</div>
            </div>
            <h1>Connectez-vous à Baara</h1>
            <p>Cliquez sur le bouton ci-dessous pour vous connecter à votre compte.</p>
            <a href="{{.Link}}" class="cta">Se connecter</a>
            <p class="note">Ce lien expire dans 15 minutes.</p>
            <p class="note">Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email.</p>
        </div>
        <div class="footer">
            <p>Baara — Recrutez mieux, plus vite.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Link": link})
}

func (s *EmailService) renderLoginEmailTextFR(link string) string {
	return fmt.Sprintf(`Connectez-vous à Baara

Cliquez sur le lien ci-dessous pour vous connecter à votre compte :

%s

Ce lien expire dans 15 minutes.

Si vous n'avez pas demandé ce lien, vous pouvez ignorer cet email.

— L'équipe Baara
`, link)
}

func (s *EmailService) renderLoginEmailEN(link string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { margin-bottom: 16px; color: #4a4a4a; }
        .cta { display: block; background: #0066cc; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 32px 0; }
        .cta:hover { background: #0052a3; }
        .note { font-size: 14px; color: #888; text-align: center; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Baara</div>
            </div>
            <h1>Sign in to Baara</h1>
            <p>Click the button below to sign in to your account.</p>
            <a href="{{.Link}}" class="cta">Sign in</a>
            <p class="note">This link expires in 15 minutes.</p>
            <p class="note">If you didn't request this link, you can ignore this email.</p>
        </div>
        <div class="footer">
            <p>Baara — Hire better, faster.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Link": link})
}

func (s *EmailService) renderLoginEmailTextEN(link string) string {
	return fmt.Sprintf(`Sign in to Baara

Click the link below to sign in to your account:

%s

This link expires in 15 minutes.

If you didn't request this link, you can ignore this email.

— The Baara team
`, link)
}

//nolint:misspell // false positive
func (s *EmailService) renderWelcomeEmailFR(link string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { margin-bottom: 16px; color: #4a4a4a; }
        .highlight { background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 24px 0; }
        .cta { display: block; background: #0066cc; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 32px 0; }
        .note { font-size: 14px; color: #888; text-align: center; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Baara</div>
            </div>
            <h1>Bienvenue sur Baara !</h1>
            <p>Vous êtes à un clic de créer votre Proof Profile — la meilleure façon de montrer ce que vous savez faire.</p>
            <div class="highlight">
                <strong>Avec Baara :</strong>
                <ul style="margin: 12px 0 0; padding-left: 20px;">
                    <li>Montrez votre travail, pas juste votre CV</li>
                    <li>Recevez des retours constructifs</li>
                    <li>Soyez évalué sur vos compétences réelles</li>
                </ul>
            </div>
            <a href="{{.Link}}" class="cta">Créer mon Proof Profile</a>
            <p class="note">Ce lien expire dans 15 minutes.</p>
        </div>
        <div class="footer">
            <p>Baara — Recrutez mieux, plus vite.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Link": link})
}

//nolint:misspell // false positive
func (s *EmailService) renderWelcomeEmailTextFR(link string) string {
	return fmt.Sprintf(`Bienvenue sur Baara !

Vous êtes à un clic de créer votre Proof Profile — la meilleure façon de montrer ce que vous savez faire.

Avec Baara :
- Montrez votre travail, pas juste votre CV
- Recevez des retours constructifs
- Soyez évalué sur vos compétences réelles

Créez votre Proof Profile : %s

Ce lien expire dans 15 minutes.

— L'équipe Baara
`, link)
}

func (s *EmailService) renderWelcomeEmailEN(link string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { margin-bottom: 16px; color: #4a4a4a; }
        .highlight { background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 24px 0; }
        .cta { display: block; background: #0066cc; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 32px 0; }
        .note { font-size: 14px; color: #888; text-align: center; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Baara</div>
            </div>
            <h1>Welcome to Baara!</h1>
            <p>You're one click away from creating your Proof Profile — the best way to showcase what you can do.</p>
            <div class="highlight">
                <strong>With Baara:</strong>
                <ul style="margin: 12px 0 0; padding-left: 20px;">
                    <li>Show your work, not just your resume</li>
                    <li>Get constructive feedback</li>
                    <li>Be evaluated on your real skills</li>
                </ul>
            </div>
            <a href="{{.Link}}" class="cta">Create my Proof Profile</a>
            <p class="note">This link expires in 15 minutes.</p>
        </div>
        <div class="footer">
            <p>Baara — Hire better, faster.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Link": link})
}

func (s *EmailService) renderWelcomeEmailTextEN(link string) string {
	return fmt.Sprintf(`Welcome to Baara!

You're one click away from creating your Proof Profile — the best way to showcase what you can do.

With Baara:
- Show your work, not just your resume
- Get constructive feedback
- Be evaluated on your real skills

Create your Proof Profile: %s

This link expires in 15 minutes.

— The Baara team
`, link)
}

//nolint:misspell // false positive
func (s *EmailService) renderRecruiterInviteFR(link, orgName string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { margin-bottom: 16px; color: #4a4a4a; }
        .cta { display: block; background: #0066cc; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 32px 0; }
        .note { font-size: 14px; color: #888; text-align: center; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Baara</div>
            </div>
            <h1>Bienvenue sur Baara !</h1>
            <p>Votre compte pour <strong>{{.OrgName}}</strong> est prêt à être activé.</p>
            <p>Avec Baara, vous pourrez :</p>
            <ul style="color: #4a4a4a;">
                <li>Créer des évaluations basées sur le travail réel</li>
                <li>Inviter des candidats et suivre leur progression</li>
                <li>Prendre des décisions de recrutement plus éclairées</li>
            </ul>
            <a href="{{.Link}}" class="cta">Activer mon compte</a>
            <p class="note">Ce lien expire dans 7 jours.</p>
        </div>
        <div class="footer">
            <p>Baara — Recrutez mieux, plus vite.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Link": link, "OrgName": orgName})
}

//nolint:misspell // false positive
func (s *EmailService) renderRecruiterInviteTextFR(link, orgName string) string {
	return fmt.Sprintf(`Bienvenue sur Baara !

Votre compte pour %s est prêt à être activé.

Avec Baara, vous pourrez :
- Créer des évaluations basées sur le travail réel
- Inviter des candidats et suivre leur progression
- Prendre des décisions de recrutement plus éclairées

Activez votre compte : %s

Ce lien expire dans 7 jours.

— L'équipe Baara
`, orgName, link)
}

func (s *EmailService) renderRecruiterInviteEN(link, orgName string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { margin-bottom: 16px; color: #4a4a4a; }
        .cta { display: block; background: #0066cc; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 32px 0; }
        .note { font-size: 14px; color: #888; text-align: center; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Baara</div>
            </div>
            <h1>Welcome to Baara!</h1>
            <p>Your account for <strong>{{.OrgName}}</strong> is ready to be activated.</p>
            <p>With Baara, you'll be able to:</p>
            <ul style="color: #4a4a4a;">
                <li>Create assessments based on real work</li>
                <li>Invite candidates and track their progress</li>
                <li>Make more informed hiring decisions</li>
            </ul>
            <a href="{{.Link}}" class="cta">Activate my account</a>
            <p class="note">This link expires in 7 days.</p>
        </div>
        <div class="footer">
            <p>Baara — Hire better, faster.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Link": link, "OrgName": orgName})
}

func (s *EmailService) renderRecruiterInviteTextEN(link, orgName string) string {
	return fmt.Sprintf(`Welcome to Baara!

Your account for %s is ready to be activated.

With Baara, you'll be able to:
- Create assessments based on real work
- Invite candidates and track their progress
- Make more informed hiring decisions

Activate your account: %s

This link expires in 7 days.

— The Baara team
`, orgName, link)
}

func (s *EmailService) renderCandidateInviteFR(link, orgName, jobTitle string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { margin-bottom: 16px; color: #4a4a4a; }
        .highlight { background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center; }
        .cta { display: block; background: #0066cc; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 32px 0; }
        .note { font-size: 14px; color: #888; text-align: center; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Baara</div>
            </div>
            <h1>Vous êtes invité !</h1>
            <p><strong>{{.OrgName}}</strong> vous invite à compléter une évaluation pour le poste de :</p>
            <div class="highlight">
                <strong style="font-size: 18px;">{{.JobTitle}}</strong>
            </div>
            <p>Cette évaluation vous permettra de démontrer vos compétences à travers un exercice pratique. Pas de questions pièges, juste du vrai travail.</p>
            <a href="{{.Link}}" class="cta">Commencer l'évaluation</a>
            <p class="note">Ce lien expire dans 14 jours.</p>
        </div>
        <div class="footer">
            <p>Baara — Montrez ce que vous savez faire.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Link": link, "OrgName": orgName, "JobTitle": jobTitle})
}

func (s *EmailService) renderCandidateInviteTextFR(link, orgName, jobTitle string) string {
	return fmt.Sprintf(`Vous êtes invité !

%s vous invite à compléter une évaluation pour le poste de :

%s

Cette évaluation vous permettra de démontrer vos compétences à travers un exercice pratique. Pas de questions pièges, juste du vrai travail.

Commencez l'évaluation : %s

Ce lien expire dans 14 jours.

— L'équipe Baara
`, orgName, jobTitle, link)
}

func (s *EmailService) renderCandidateInviteEN(link, orgName, jobTitle string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { margin-bottom: 16px; color: #4a4a4a; }
        .highlight { background: #f0f7ff; padding: 20px; border-radius: 8px; margin: 24px 0; text-align: center; }
        .cta { display: block; background: #0066cc; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 32px 0; }
        .note { font-size: 14px; color: #888; text-align: center; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Baara</div>
            </div>
            <h1>You're invited!</h1>
            <p><strong>{{.OrgName}}</strong> invites you to complete an assessment for the position of:</p>
            <div class="highlight">
                <strong style="font-size: 18px;">{{.JobTitle}}</strong>
            </div>
            <p>This assessment will allow you to demonstrate your skills through a practical exercise. No trick questions, just real work.</p>
            <a href="{{.Link}}" class="cta">Start the assessment</a>
            <p class="note">This link expires in 14 days.</p>
        </div>
        <div class="footer">
            <p>Baara — Show what you can do.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Link": link, "OrgName": orgName, "JobTitle": jobTitle})
}

func (s *EmailService) renderCandidateInviteTextEN(link, orgName, jobTitle string) string {
	return fmt.Sprintf(`You're invited!

%s invites you to complete an assessment for the position of:

%s

This assessment will allow you to demonstrate your skills through a practical exercise. No trick questions, just real work.

Start the assessment: %s

This link expires in 14 days.

— The Baara team
`, orgName, jobTitle, link)
}

// SendFormatRequestResponse sends an email to the candidate when their format request is responded to
func (s *EmailService) SendFormatRequestResponse(email string, approved bool, responseMessage string, locale string) error {
	link := fmt.Sprintf("%s/app/work-sample", s.appURL)

	var subject, htmlBody, textBody string

	if approved {
		if locale == "en" {
			subject = "Your alternative format request has been approved"
			htmlBody = s.renderFormatRequestApprovedEN(link, responseMessage)
			textBody = s.renderFormatRequestApprovedTextEN(link, responseMessage)
		} else {
			subject = "Votre demande de format alternatif a été approuvée"
			htmlBody = s.renderFormatRequestApprovedFR(link, responseMessage)
			textBody = s.renderFormatRequestApprovedTextFR(link, responseMessage)
		}
	} else {
		if locale == "en" {
			subject = "Update on your alternative format request"
			htmlBody = s.renderFormatRequestDeniedEN(link, responseMessage)
			textBody = s.renderFormatRequestDeniedTextEN(link, responseMessage)
		} else {
			subject = "Mise à jour sur votre demande de format alternatif"
			htmlBody = s.renderFormatRequestDeniedFR(link, responseMessage)
			textBody = s.renderFormatRequestDeniedTextFR(link, responseMessage)
		}
	}

	return s.mailer.Send(email, subject, htmlBody, textBody)
}

func (s *EmailService) renderFormatRequestApprovedFR(link, responseMessage string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { margin-bottom: 16px; color: #4a4a4a; }
        .success-badge { display: inline-block; background: #d4edda; color: #155724; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 16px; }
        .message-box { background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #0066cc; margin: 24px 0; }
        .cta { display: block; background: #0066cc; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 32px 0; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Baara</div>
            </div>
            <div style="text-align: center;"><span class="success-badge">✓ Approuvée</span></div>
            <h1>Votre demande a été approuvée</h1>
            <p>Bonne nouvelle ! Notre équipe a accepté votre demande de format alternatif pour le Work Sample.</p>
            {{if .ResponseMessage}}
            <div class="message-box">
                <strong>Message du recruteur :</strong><br>
                {{.ResponseMessage}}
            </div>
            {{end}}
            <p>Vous pouvez maintenant accéder à votre Work Sample pour voir les prochaines étapes.</p>
            <a href="{{.Link}}" class="cta">Voir mon Work Sample</a>
        </div>
        <div class="footer">
            <p>Baara — Montrez ce que vous savez faire.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Link": link, "ResponseMessage": responseMessage})
}

func (s *EmailService) renderFormatRequestApprovedTextFR(link, responseMessage string) string {
	msg := `Votre demande a été approuvée

Bonne nouvelle ! Notre équipe a accepté votre demande de format alternatif pour le Work Sample.
`
	if responseMessage != "" {
		msg += fmt.Sprintf(`
Message du recruteur :
%s
`, responseMessage)
	}
	msg += fmt.Sprintf(`
Vous pouvez maintenant accéder à votre Work Sample pour voir les prochaines étapes : %s

— L'équipe Baara
`, link)
	return msg
}

func (s *EmailService) renderFormatRequestApprovedEN(link, responseMessage string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { margin-bottom: 16px; color: #4a4a4a; }
        .success-badge { display: inline-block; background: #d4edda; color: #155724; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 16px; }
        .message-box { background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #0066cc; margin: 24px 0; }
        .cta { display: block; background: #0066cc; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 32px 0; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Baara</div>
            </div>
            <div style="text-align: center;"><span class="success-badge">✓ Approved</span></div>
            <h1>Your request has been approved</h1>
            <p>Good news! Our team has approved your alternative format request for the Work Sample.</p>
            {{if .ResponseMessage}}
            <div class="message-box">
                <strong>Message from the recruiter:</strong><br>
                {{.ResponseMessage}}
            </div>
            {{end}}
            <p>You can now access your Work Sample to see the next steps.</p>
            <a href="{{.Link}}" class="cta">View my Work Sample</a>
        </div>
        <div class="footer">
            <p>Baara — Show what you can do.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Link": link, "ResponseMessage": responseMessage})
}

func (s *EmailService) renderFormatRequestApprovedTextEN(link, responseMessage string) string {
	msg := `Your request has been approved

Good news! Our team has approved your alternative format request for the Work Sample.
`
	if responseMessage != "" {
		msg += fmt.Sprintf(`
Message from the recruiter:
%s
`, responseMessage)
	}
	msg += fmt.Sprintf(`
You can now access your Work Sample to see the next steps: %s

— The Baara team
`, link)
	return msg
}

func (s *EmailService) renderFormatRequestDeniedFR(link, responseMessage string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { margin-bottom: 16px; color: #4a4a4a; }
        .message-box { background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #0066cc; margin: 24px 0; }
        .cta { display: block; background: #0066cc; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 32px 0; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Baara</div>
            </div>
            <h1>Mise à jour sur votre demande</h1>
            <p>Après examen de votre demande de format alternatif, notre équipe n'a malheureusement pas pu l'accepter cette fois-ci.</p>
            {{if .ResponseMessage}}
            <div class="message-box">
                <strong>Message du recruteur :</strong><br>
                {{.ResponseMessage}}
            </div>
            {{end}}
            <p>Vous pouvez toujours compléter le Work Sample dans son format actuel. N'hésitez pas à nous contacter si vous avez des questions.</p>
            <a href="{{.Link}}" class="cta">Continuer le Work Sample</a>
        </div>
        <div class="footer">
            <p>Baara — Montrez ce que vous savez faire.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Link": link, "ResponseMessage": responseMessage})
}

func (s *EmailService) renderFormatRequestDeniedTextFR(link, responseMessage string) string {
	msg := `Mise à jour sur votre demande

Après examen de votre demande de format alternatif, notre équipe n'a malheureusement pas pu l'accepter cette fois-ci.
`
	if responseMessage != "" {
		msg += fmt.Sprintf(`
Message du recruteur :
%s
`, responseMessage)
	}
	msg += fmt.Sprintf(`
Vous pouvez toujours compléter le Work Sample dans son format actuel : %s

— L'équipe Baara
`, link)
	return msg
}

func (s *EmailService) renderFormatRequestDeniedEN(link, responseMessage string) string {
	tmpl := `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .header { text-align: center; margin-bottom: 32px; }
        .logo { font-size: 28px; font-weight: bold; color: #0066cc; }
        h1 { color: #1a1a1a; font-size: 24px; margin-bottom: 16px; text-align: center; }
        p { margin-bottom: 16px; color: #4a4a4a; }
        .message-box { background: #f8f9fa; padding: 16px; border-radius: 8px; border-left: 4px solid #0066cc; margin: 24px 0; }
        .cta { display: block; background: #0066cc; color: white !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; text-align: center; margin: 32px 0; }
        .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; font-size: 13px; color: #888; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            <div class="header">
                <div class="logo">Baara</div>
            </div>
            <h1>Update on your request</h1>
            <p>After reviewing your alternative format request, our team was unfortunately unable to approve it this time.</p>
            {{if .ResponseMessage}}
            <div class="message-box">
                <strong>Message from the recruiter:</strong><br>
                {{.ResponseMessage}}
            </div>
            {{end}}
            <p>You can still complete the Work Sample in its current format. Feel free to contact us if you have any questions.</p>
            <a href="{{.Link}}" class="cta">Continue Work Sample</a>
        </div>
        <div class="footer">
            <p>Baara — Show what you can do.</p>
        </div>
    </div>
</body>
</html>
`
	return renderTemplate(tmpl, map[string]string{"Link": link, "ResponseMessage": responseMessage})
}

func (s *EmailService) renderFormatRequestDeniedTextEN(link, responseMessage string) string {
	msg := `Update on your request

After reviewing your alternative format request, our team was unfortunately unable to approve it this time.
`
	if responseMessage != "" {
		msg += fmt.Sprintf(`
Message from the recruiter:
%s
`, responseMessage)
	}
	msg += fmt.Sprintf(`
You can still complete the Work Sample in its current format: %s

— The Baara team
`, link)
	return msg
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
