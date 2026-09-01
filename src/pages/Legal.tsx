const DATE_MAJ = '31 août 2026'

export default function Legal() {
  return (
    <div className="min-h-screen bg-slate-50">
    <div className="mx-auto max-w-3xl px-6 py-12 text-sm leading-relaxed text-slate-700">
      <img src="/logo-transparent.png" alt="KFSTORE" className="mb-8 h-10" />

      <p className="mb-10 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        Document provisoire — à faire relire par GROUPE SKF SARL (et un juriste si possible) avant toute
        soumission App Store / Play Store. Dernière mise à jour : {DATE_MAJ}.
      </p>

      <h1 className="mb-2 text-2xl font-bold text-slate-900">Conditions d'utilisation & Politique de confidentialité</h1>
      <p className="mb-10 text-slate-500">
        Applicable aux applications <strong>KFSTORE</strong> (clients) et <strong>KFSTORE Agent</strong> (personnel
        interne), ainsi qu'au back-office web, édités par <strong>GROUPE SKF SARL</strong>.
      </p>

      <nav className="mb-10 flex flex-wrap gap-4 border-y border-slate-200 py-3 text-teal-700">
        <a href="#conditions" className="hover:underline">Conditions d'utilisation</a>
        <a href="#confidentialite" className="hover:underline">Politique de confidentialité</a>
        <a href="#contact" className="hover:underline">Contact</a>
      </nav>

      <section id="conditions" className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-slate-900">1. Conditions d'utilisation</h2>

        <h3 className="mb-2 mt-6 font-semibold text-slate-900">1.1 Objet</h3>
        <p className="mb-4">
          KFSTORE est la plateforme de gestion des boutiques du GROUPE SKF SARL (Conakry, Guinée). L'application{' '}
          <strong>KFSTORE</strong> permet à un client de consulter le catalogue, passer commande, suivre ses
          livraisons et gérer un éventuel crédit alimentaire (programme Aide Humanitaire). L'application{' '}
          <strong>KFSTORE Agent</strong> est réservée au personnel interne (vendeurs, caissiers, gérants,
          livreurs) pour la gestion opérationnelle des boutiques.
        </p>

        <h3 className="mb-2 mt-6 font-semibold text-slate-900">1.2 Compte utilisateur</h3>
        <p className="mb-4">
          L'accès aux deux applications nécessite un compte associé à un numéro de téléphone. Ce numéro sert
          d'identifiant et de canal de vérification (code envoyé par SMS). L'utilisateur s'engage à fournir des
          informations exactes et à préserver la confidentialité de son mot de passe. Toute activité effectuée
          depuis un compte est présumée effectuée par son titulaire.
        </p>

        <h3 className="mb-2 mt-6 font-semibold text-slate-900">1.3 Crédit alimentaire (Aide Humanitaire)</h3>
        <p className="mb-4">
          Certains clients, rattachés à un établissement partenaire (école, entreprise…), peuvent bénéficier d'un
          crédit alimentaire soumis à validation de garants désignés par cet établissement et à un plafond
          calculé selon un barème. Toute demande de crédit engage son bénéficiaire à rembourser les sommes
          avancées selon l'échéance communiquée. Un impayé non régularisé peut entraîner la suspension du
          plafond de crédit.
        </p>

        <h3 className="mb-2 mt-6 font-semibold text-slate-900">1.4 Usage loyal</h3>
        <p className="mb-4">
          L'utilisateur s'interdit tout usage frauduleux des applications : fausse déclaration de remboursement,
          usurpation d'identité, tentative d'accès à des comptes ou données ne lui appartenant pas. GROUPE SKF
          SARL se réserve le droit de suspendre un compte en cas de manquement constaté.
        </p>

        <h3 className="mb-2 mt-6 font-semibold text-slate-900">1.5 Disponibilité</h3>
        <p className="mb-4">
          Les applications sont fournies "en l'état". GROUPE SKF SARL met en œuvre des moyens raisonnables pour
          assurer leur disponibilité mais ne garantit pas une continuité de service ininterrompue (maintenance,
          incidents réseau ou fournisseurs tiers — notamment l'envoi de SMS).
        </p>
      </section>

      <section id="confidentialite" className="mb-12">
        <h2 className="mb-4 text-lg font-bold text-slate-900">2. Politique de confidentialité</h2>

        <h3 className="mb-2 mt-6 font-semibold text-slate-900">2.1 Responsable de traitement</h3>
        <p className="mb-4">GROUPE SKF SARL, Conakry, République de Guinée.</p>

        <h3 className="mb-2 mt-6 font-semibold text-slate-900">2.2 Données collectées</h3>
        <ul className="mb-4 list-disc space-y-1 pl-5">
          <li>Identité et contact : nom, prénom, numéro de téléphone.</li>
          <li>Données de compte : mot de passe (stocké de façon chiffrée, jamais en clair), historique de connexion.</li>
          <li>Données commerciales : commandes, achats, moyens de paiement utilisés, historique de crédit et de remboursement.</li>
          <li>Données de localisation approximative : boutique(s) fréquentée(s), adresse de livraison renseignée.</li>
          <li>Données techniques : jeton de notification push (si les notifications sont activées), journal d'audit des actions sensibles (personnel interne uniquement).</li>
        </ul>

        <h3 className="mb-2 mt-6 font-semibold text-slate-900">2.3 Finalités</h3>
        <p className="mb-4">
          Ces données sont utilisées pour : la gestion du compte et l'authentification (y compris la vérification
          par SMS) ; le traitement des commandes, ventes et livraisons ; la gestion du crédit alimentaire et de
          son remboursement ; l'envoi de notifications liées au compte (confirmation de commande, rappel
          d'échéance, alerte crédit) ; la sécurité de la plateforme (journal d'audit, prévention de la fraude).
        </p>

        <h3 className="mb-2 mt-6 font-semibold text-slate-900">2.4 Partage des données</h3>
        <p className="mb-4">
          Les données ne sont jamais vendues. Elles peuvent être transmises à des sous-traitants strictement
          nécessaires au fonctionnement du service : fournisseur d'envoi de SMS (vérification de compte,
          notifications), service de notifications push (Expo). Ces prestataires n'accèdent qu'aux données
          nécessaires à leur mission et ne peuvent les réutiliser à d'autres fins.
        </p>

        <h3 className="mb-2 mt-6 font-semibold text-slate-900">2.5 Conservation</h3>
        <p className="mb-4">
          Les données sont conservées pendant la durée de la relation commerciale, puis archivées le temps
          nécessaire au respect des obligations comptables et légales applicables en République de Guinée.
        </p>

        <h3 className="mb-2 mt-6 font-semibold text-slate-900">2.6 Sécurité</h3>
        <p className="mb-4">
          Les mots de passe sont stockés sous forme chiffrée (hachage). L'accès au back-office et aux fonctions
          sensibles est soumis à une authentification à deux facteurs et à une matrice de droits par rôle. Toute
          action sensible (validation manuelle, réinitialisation de mot de passe, accès aux codes de secours) est
          tracée dans un journal d'audit.
        </p>

        <h3 className="mb-2 mt-6 font-semibold text-slate-900">2.7 Vos droits</h3>
        <p className="mb-4">
          Vous pouvez demander l'accès, la rectification ou la suppression de vos données personnelles, ou vous
          opposer à leur traitement, en contactant GROUPE SKF SARL aux coordonnées ci-dessous. La suppression
          d'un compte n'efface pas les données dont la conservation est requise par la loi (registres
          comptables notamment).
        </p>
      </section>

      <section id="contact" className="mb-6">
        <h2 className="mb-4 text-lg font-bold text-slate-900">3. Contact</h2>
        <p>
          Pour toute question relative à ces conditions ou à vos données personnelles :{' '}
          <a className="text-teal-700 hover:underline" href="mailto:contact@groupeskf.com">contact@groupeskf.com</a>
        </p>
      </section>
    </div>
    </div>
  )
}
