import {
  understandLocally,
  chooseAccountRole,
  unknownUserAction,
  applyAccountAwareIntent,
  applyRoleHints,
  looksLikePostJobRequest,
  roleRedirectTarget,
} from "../src/modules/whatsapp/whatsapp-bot.logic.js";

const texts = [
  "i wnat electrician jobseeker",
  "I want electrician job",
  "Naku electrician job kavali",
  "electrician jobseeker",
  "Find jobs matching my resume",
];

for (const t of texts) {
  const local = understandLocally(t);
  const role = chooseAccountRole(t);
  const withHints = applyRoleHints(t, local, "none");
  const none = applyAccountAwareIntent(withHints, "none");
  const asEmployer = applyAccountAwareIntent(withHints, "employer");
  console.log(
    JSON.stringify({
      t,
      localIntent: local.intent,
      category: local.category,
      role,
      post: looksLikePostJobRequest(t),
      noneIntent: none.intent,
      noneAction: unknownUserAction(none),
      noneCross: none.crossRole,
      empIntent: asEmployer.intent,
      empCross: asEmployer.crossRole,
      empRedirect: roleRedirectTarget(asEmployer.intent, "employer"),
    }),
  );
}
