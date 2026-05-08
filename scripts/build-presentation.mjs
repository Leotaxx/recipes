const {
  Presentation,
  PresentationFile,
  column,
  grid,
  panel,
  text,
  rule,
  shape,
  fill,
  hug,
  fixed,
  wrap,
  grow,
  fr,
  auto
} = await import("@oai/artifact-tool");

const presentation = Presentation.create({
  slideSize: { width: 1920, height: 1080 }
});

const palette = {
  ink: "#1F2528",
  muted: "#61736B",
  paper: "#FFFDF8",
  ground: "#F4F1EA",
  green: "#25362F",
  mint: "#DCEAE4",
  rust: "#B45F3A",
  blue: "#315C72"
};

function addSlide(title, subtitle, items = [], accent = palette.green) {
  const slide = presentation.slides.add();
  slide.compose(
    grid(
      {
        name: "root",
        width: fill,
        height: fill,
        columns: [fr(1.15), fr(0.85)],
        rows: [auto, fr(1), auto],
        padding: { x: 96, y: 72 },
        columnGap: 64,
        rowGap: 40,
        background: palette.ground
      },
      [
        column(
          { name: "title-stack", columnSpan: 2, width: fill, height: hug, gap: 18 },
          [
            text(title, {
              name: "title",
              width: wrap(1500),
              height: hug,
              style: { fontSize: 62, bold: true, color: palette.ink }
            }),
            rule({ name: "rule", width: fixed(280), stroke: accent, weight: 6 }),
            text(subtitle, {
              name: "subtitle",
              width: wrap(1240),
              height: hug,
              style: { fontSize: 26, color: palette.muted }
            })
          ]
        ),
        column(
          { name: "body", width: fill, height: fill, gap: 20 },
          items.map((item, index) =>
            panel(
              {
                name: `point-${index}`,
                width: fill,
                height: hug,
                padding: { x: 28, y: 22 },
                borderRadius: 8,
                fill: palette.paper,
                stroke: "#DED7CA"
              },
              text(item, {
                name: `point-text-${index}`,
                width: fill,
                height: hug,
                style: { fontSize: 24, color: palette.ink }
              })
            )
          )
        ),
        panel(
          {
            name: "signal",
            width: fill,
            height: fill,
            padding: 42,
            borderRadius: 8,
            fill: accent,
            stroke: accent
          },
          column(
            { name: "signal-stack", width: fill, height: fill, gap: 24 },
            [
              text("RecipeOps", {
                name: "brand",
                width: fill,
                height: hug,
                style: { fontSize: 48, bold: true, color: "#FFFFFF" }
              }),
              shape({
                name: "divider",
                width: fill,
                height: fixed(2),
                fill: "#FFFFFF",
                opacity: 0.35
              }),
              text("frontend + catalog API + recommendation API + PostgreSQL", {
                name: "stack",
                width: fill,
                height: hug,
                style: { fontSize: 30, color: "#F7FBF9" }
              }),
              text("Automated with GitHub Actions, Terraform, Azure Container Apps, ACR, and Trivy.", {
                name: "tools",
                width: fill,
                height: grow(1),
                style: { fontSize: 23, color: "#E5F0EC" }
              })
            ]
          )
        ),
        text("RecipeOps release deck", {
          name: "footer",
          columnSpan: 2,
          width: fill,
          height: hug,
          style: { fontSize: 16, color: palette.muted }
        })
      ]
    ),
    { frame: { left: 0, top: 0, width: 1920, height: 1080 }, baseUnit: 8 }
  );
}

addSlide(
  "RecipeOps CI/CD",
  "A microservice deployment with automated provisioning, testing, image scanning, and revision-based rollback.",
  ["Three deployable services plus one managed data layer.", "Local runs use Docker Compose.", "Cloud deployment targets Azure Container Apps."],
  palette.green
);

addSlide(
  "Architecture",
  "Service boundaries are explicit: the recommendation API calls the catalog API instead of owning database access.",
  ["Frontend proxies browser requests to backend services.", "Catalog API owns recipe validation and persistence.", "PostgreSQL is the durable data layer."],
  palette.blue
);

addSlide(
  "Pipeline",
  "Pull requests prove quality; main branch releases build immutable images and update Azure revisions.",
  ["Node and Python tests run independently.", "Each service image is built from its own Dockerfile.", "Trivy blocks high and critical vulnerabilities."],
  palette.rust
);

addSlide(
  "Infrastructure as Code",
  "Terraform provisions all release infrastructure so environments can be destroyed and rebuilt consistently.",
  ["Resource group, ACR, Container Apps, PostgreSQL, and Log Analytics.", "Environment-specific variables support dev and prod.", "State should be moved to Azure Storage for team operation."],
  palette.green
);

addSlide(
  "Release Strategy",
  "Azure Container Apps multiple revision mode supports blue/green rollout and fast rollback.",
  ["Images are tagged with the Git commit SHA.", "Traffic can shift gradually to a new revision.", "Rollback moves traffic back to the last healthy revision."],
  palette.blue
);

addSlide(
  "Operations",
  "The plan covers monitoring, scaling, security, backup, restore, and sustainability.",
  ["Log Analytics collects Container Apps logs.", "Health endpoints validate service availability.", "PostgreSQL automated backups support point-in-time recovery."],
  palette.rust
);

addSlide(
  "Additional Features",
  "The implementation includes features beyond the minimum microservice requirement.",
  ["Vulnerability scanning with SARIF upload.", "Seeded migrations for repeatable local runs.", "Health endpoints and blue/green-capable revisions."],
  palette.green
);

addSlide(
  "Demo Flow",
  "Show the running app first, then prove the pipeline and release-management decisions.",
  ["Open http://localhost:8080 and add a recipe.", "Show CI tests, image build, and scan jobs.", "Explain Terraform apply, Container Apps update, and rollback."],
  palette.blue
);

const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save("docs/RecipeOps-CICD-Presentation.pptx");
