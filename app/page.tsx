import Image from "next/image";
import Link from "next/link";

const services = [
  {
    title: "AI Workflow Automation",
    description:
      "Automate repetitive tasks such as lead intake, follow-ups, document handling, customer messages, and internal operations.",
  },
  {
    title: "Internal AI Assistants",
    description:
      "Build private tools that help teams search documents, draft responses, summarize information, and answer operational questions.",
  },
  {
    title: "Custom Dashboards",
    description:
      "Create clean dashboards that show workflow status, customer activity, business metrics, and next actions in one place.",
  },
  {
    title: "API & System Integrations",
    description:
      "Connect CRMs, forms, spreadsheets, email systems, payment platforms, databases, and third-party services.",
  },
  {
    title: "Automation Repair",
    description:
      "Diagnose broken or unreliable workflows so leads, orders, emails, invoices, and follow-ups do not silently fail.",
  },
];

const trustPoints = [
  "Clear business requirements before building",
  "Simple systems that owners and teams can actually use",
  "AI with human review where accuracy matters",
  "Reliable workflows with logging, tracking, and recovery paths",
];

const processSteps = [
  {
    step: "01",
    title: "Diagnose",
    description:
      "We map the current workflow, identify bottlenecks, and define what success should look like.",
  },
  {
    step: "02",
    title: "Build",
    description:
      "We create the software, automation, AI assistant, dashboard, or integration needed to solve the problem.",
  },
  {
    step: "03",
    title: "Improve",
    description:
      "We test the system, refine the workflow, and make it easier to maintain as the business grows.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {/* Soft background accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-12rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-200/50 blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-8rem] h-[30rem] w-[30rem] rounded-full bg-blue-200/40 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm">
              <span className="text-sm font-semibold tracking-wide text-slate-900">
                BT
              </span>
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-950">
                Baker Technologies
              </p>
              <p className="text-xs text-slate-500">
                AI Software & Workflow Systems
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <Link href="#services" className="transition hover:text-slate-950">
              Services
            </Link>
            <Link href="#process" className="transition hover:text-slate-950">
              Process
            </Link>
            <Link href="#contact" className="transition hover:text-slate-950">
              Contact
            </Link>
          </nav>

          <Link
            href="#contact"
            className="hidden rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 md:inline-flex"
          >
            Start a Project
          </Link>
        </header>

        {/* Hero */}
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:pb-28 lg:pt-20">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-cyan-500" />
              AI systems for growing businesses
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Practical AI software that makes business workflows faster,
              smarter, and more reliable.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
              Baker Technologies designs and builds AI-assisted software,
              internal tools, automations, dashboards, and workflow systems that
              help businesses reduce manual work, organize information, and
              respond faster.
            </p>

            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="#contact"
                className="rounded-full bg-slate-950 px-7 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-slate-300 transition hover:bg-slate-800"
              >
                Request a Consultation
              </Link>
              <Link
                href="#services"
                className="rounded-full border border-slate-200 bg-white px-7 py-3.5 text-center text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-slate-100"
              >
                View Services
              </Link>
            </div>

            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4 border-t border-slate-200 pt-8">
              <div>
                <p className="text-2xl font-semibold text-slate-950">AI</p>
                <p className="mt-1 text-sm text-slate-500">Workflow tools</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-950">API</p>
                <p className="mt-1 text-sm text-slate-500">Integrations</p>
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-950">Ops</p>
                <p className="mt-1 text-sm text-slate-500">
                  Automation systems
                </p>
              </div>
            </div>
          </div>

          {/* Hero phone */}
          <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-4 shadow-2xl shadow-slate-200/80 backdrop-blur">
            <div className="flex justify-center rounded-[1.5rem] border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6">
              <div className="w-full max-w-[340px] rounded-[2.5rem] border-[8px] border-slate-900 bg-white shadow-xl">
                <div className="flex justify-center pt-3">
                  <div className="h-1.5 w-20 rounded-full bg-slate-300" />
                </div>

                <div className="px-4 pb-4 pt-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        AI Knowledge Assistant
                      </p>
                      <p className="text-xs text-slate-500">
                        Company document search
                      </p>
                    </div>
                    <div className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                      Online
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-slate-950 px-4 py-3 text-sm leading-6 text-white">
                      Can you find the policy for vendor security reviews?
                    </div>

                    <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                      I found the relevant section in the company documents.
                    </div>

                    <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-cyan-100 bg-cyan-50 px-4 py-3 text-sm leading-6 text-slate-700">
                      <p className="font-medium text-slate-950">
                        Vendor security reviews are required before approval for
                        access to internal systems.
                      </p>

                      <p className="mt-2 text-slate-600">
                        Vendors handling internal data must complete a security
                        review and provide required documentation before
                        onboarding.
                      </p>

                      <div className="mt-3 rounded-xl border border-cyan-100 bg-white p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
                          Document Reference
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-900">
                          Vendor Security Policy.pdf
                        </p>
                        <p className="text-xs text-slate-500">
                          Section 4.2 • Page 7
                        </p>
                      </div>
                    </div>

                    <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-slate-950 px-4 py-3 text-sm leading-6 text-white">
                      Show me the exact source.
                    </div>

                    <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                      Retrieved from:
                      <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-xs font-medium text-slate-950">
                          Vendor Security Policy.pdf
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          “All vendors requiring access to internal systems or
                          sensitive company data must complete a security review
                          before approval.”
                        </p>
                        <p className="mt-2 text-[11px] font-medium text-cyan-700">
                          Reference: Section 4.2 • Page 7
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 shadow-sm">
                    Ask about your documents...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
              What We Build
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              AI software and workflow systems that solve practical business
              problems.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              We help companies turn messy manual processes into clean, reliable
              systems using AI, automation, databases, APIs, and custom
              software.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.title}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-cyan-200 hover:shadow-md"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
                  <span className="text-lg">✦</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-950">
                  {service.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Difference section */}
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
                Why Baker Technologies
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Built for real operations, not just impressive demos.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {trustPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200"
                >
                  <p className="text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Founder section */}
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid items-center gap-10 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
                Founder-led AI software
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Direct technical work from a founder who understands software,
                systems, and business workflows.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Baker Technologies is built around practical engineering, clear
                communication, and software that solves real operational
                problems. You work directly with a technical founder instead of
                being handed off through layers of sales and project management.
              </p>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
              <div className="rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                  <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full bg-slate-100 shadow-lg shadow-slate-300 ring-1 ring-slate-200">
                    <Image
                      src="/imgs/julian-baker.jpg"
                      alt="Julian Baker, Founder and Principal Engineer at Baker Technologies"
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-slate-950">
                      Julian Baker
                    </p>
                    <p className="mt-1 text-sm font-medium text-cyan-700">
                      Founder & Principal Engineer
                    </p>
                    <p className="mt-4 leading-7 text-slate-600">
                      AI software, workflow automation, backend systems, and
                      practical business tools built with an engineering-first
                      approach.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Focus
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      AI systems & workflow automation
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Approach
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      Practical, reliable, founder-led delivery
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="https://www.linkedin.com/in/julianbakerphd"
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-slate-950 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Connect on LinkedIn
                  </Link>
                  <Link
                    href="https://www.linkedin.com/services/page/0a890a34326a717329/"
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    Discuss a Project
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Process */}
        <section id="process" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-700">
              How We Work
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              A practical process from problem to working system.
            </h2>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {processSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <p className="text-sm font-semibold text-cyan-700">
                  {item.step}
                </p>
                <h3 className="mt-5 text-2xl font-semibold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-4 leading-7 text-slate-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section id="contact" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 px-6 py-12 text-white shadow-2xl shadow-slate-300/60 md:px-12 lg:px-16">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Have a workflow that could be faster, smarter, or more
                  reliable?
                </h2>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
                  Baker Technologies can help design a practical AI software
                  system around the way your business actually works.
                </p>
              </div>
              <Link
                href="https://www.linkedin.com/services/page/0a890a34326a717329/"
                className="rounded-full bg-white px-8 py-4 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
              >
                Discuss a Project
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white/60 px-6 py-8 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-slate-500 sm:flex-row">
            <p>
              © {new Date().getFullYear()} Baker Technologies. All rights
              reserved.
            </p>
            <p>AI software • workflow automation • custom systems</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
