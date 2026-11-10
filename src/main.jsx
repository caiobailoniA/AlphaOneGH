import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowUpRight,
  ArrowRight,
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  FileText,
  MessageSquare,
  Settings,
  HelpCircle,
  Bell,
  ChevronDown,
  ChevronRight,
  Plus,
  ShieldCheck,
  CalendarDays,
  CircleCheck,
  Clock3,
  X,
  Download,
  Leaf,
  Menu,
} from "lucide-react";
import {
  ANNUAL_OBLIGATION,
  PLAN_YEAR,
  getProgress,
  initialDistributions,
  money,
  validateRequest,
} from "./rmd";
import "./styles.css";

const navItems = [
  [LayoutDashboard, "Overview"],
  [Wallet, "Accounts"],
  [ArrowLeftRight, "Activity"],
  [FileText, "Documents"],
  [MessageSquare, "Messages"],
];
const dateLabel = (value) =>
  new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export function ProgressCard({ progress, onRequest }) {
  return (
    <section className="card progress-card">
      <div className="section-heading">
        <div>
          <div className="eyebrow">YOUR REQUIRED MINIMUM DISTRIBUTION</div>
          <h2>A little progress. A lot of peace of mind.</h2>
        </div>
        <span
          className={`badge ${progress.status === "Satisfied" ? "green" : ""}`}
        >
          <span className="dot" />
          {progress.status === "Satisfied"
            ? "Fully satisfied"
            : progress.status === "In flight"
              ? "In flight"
              : "On track"}
        </span>
      </div>
      <div className="progress-body">
        <div
          className="gauge"
          role="progressbar"
          aria-label="Annual RMD completed"
          aria-valuenow={Math.round(progress.percentage)}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ "--progress": `${progress.percentage}%` }}
        >
          <div className="gauge-center">
            <span className="gauge-percent">
              {Math.round(progress.percentage)}
              <small>%</small>
            </span>
            <span>of annual RMD</span>
            <span className="gauge-caption">completed</span>
          </div>
        </div>
        <div className="progress-details">
          <div className="distributed-label">
            <span className="dot" /> Distributed this year
          </div>
          <div className="distributed-amount">
            {money(progress.completed)}
            <span> / {money(ANNUAL_OBLIGATION)}</span>
          </div>
          <div className="thin-progress">
            <span style={{ width: `${progress.percentage}%` }} />
          </div>
          <div className="rmd-stats">
            <div>
              <span>Remaining RMD</span>
              <strong>{money(progress.remaining)}</strong>
            </div>
            <div>
              <span>Complete by</span>
              <strong>Dec 31, {PLAN_YEAR}</strong>
            </div>
          </div>
          {progress.inFlight > 0 && (
            <div className="processing-note" role="status">
              {money(progress.inFlight)} is processing · included after
              settlement
            </div>
          )}
          <button
            className="button primary"
            onClick={onRequest}
            disabled={progress.available === 0}
          >
            {progress.status === "Satisfied" ? (
              <>
                <CircleCheck size={16} /> Annual RMD complete
              </>
            ) : (
              <>
                <Plus size={16} /> Request a distribution
              </>
            )}
          </button>
        </div>
      </div>
      <div className="card-footer">
        <ShieldCheck size={17} />
        <span>
          {progress.status === "Satisfied"
            ? "You’ve met your annual RMD. One less thing to think about."
            : "You’re making steady progress toward your annual requirement."}
        </span>
        <span className="live-dot" />{" "}
        <span className="live-text">Live updates</span>
      </div>
    </section>
  );
}

function RequestModal({ available, onClose, onSubmit }) {
  const [amount, setAmount] = useState(String(available));
  const [error, setError] = useState("");
  const dialog = useRef(null);
  useEffect(() => {
    const el = dialog.current;
    el.showModal();
    return () => el.close();
  }, []);
  function submit(event) {
    event.preventDefault();
    const problem = validateRequest(amount, available);
    if (problem) {
      setError(problem);
      return;
    }
    onSubmit(Number(amount));
  }
  return (
    <dialog ref={dialog} onCancel={onClose} className="modal">
      <form onSubmit={submit}>
        <div className="section-heading">
          <div>
            <div className="eyebrow">A STEP TOWARD YOUR GOAL</div>
            <h2>Request a distribution</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            aria-label="Close request"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>
        <p className="muted">
          Move funds from your Traditional IRA ••4829 to your linked bank
          account.
        </p>
        <label htmlFor="amount">Distribution amount</label>
        <div className="amount-input">
          <span>$</span>
          <input
            id="amount"
            type="number"
            min="0.01"
            max={available}
            step="0.01"
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-describedby="amount-help"
          />
        </div>
        <p id="amount-help" className="muted">
          {money(available, 2)} available toward your annual RMD
        </p>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="demo-notice">
          <ShieldCheck size={20} />
          <span>
            <strong>This is a demo, not a real transfer.</strong>
            <br />
            Your request appears immediately and settles automatically in 8
            seconds. No funds will move.
          </span>
        </div>
        <button className="button primary full" type="submit">
          Submit demo request <ArrowRight size={16} />
        </button>
      </form>
    </dialog>
  );
}

function DistributionHistory({ distributions, onExport }) {
  return (
    <section className="card history-card" id="distribution-history">
      <div className="section-heading">
        <div>
          <h2>Distribution activity</h2>
          <p className="muted">Every step toward this year’s goal.</p>
        </div>
        <button className="button text-button" onClick={onExport}>
          <Download size={15} /> Export{" "}
          <span className="desktop-only">history</span>
        </button>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>TRANSACTION</th>
              <th>DATE</th>
              <th>ACCOUNT</th>
              <th>STATUS</th>
              <th className="number">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {distributions.map((d) => (
              <tr key={d.id}>
                <td>
                  <div className="transaction-name">
                    <span className={`transaction-icon ${d.status}`}>
                      <ArrowUpRight size={18} />
                    </span>
                    <div>
                      <strong>RMD distribution</strong>
                      <small>Transfer to linked bank</small>
                    </div>
                  </div>
                </td>
                <td>{dateLabel(d.date)}</td>
                <td>
                  {d.account}
                  <small>••{d.ending}</small>
                </td>
                <td>
                  <span
                    className={`badge ${d.status === "completed" ? "green" : "amber"}`}
                  >
                    {d.status === "completed" ? (
                      <CircleCheck size={12} />
                    ) : (
                      <Clock3 size={12} />
                    )}
                    {d.status === "completed" ? "Completed" : "In flight"}
                  </span>
                </td>
                <td className="number amount-cell">{money(d.amount, 2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span>Showing {distributions.length} distributions</span>
        <span>January – December {PLAN_YEAR}</span>
      </div>
    </section>
  );
}

export function App() {
  const [view, setView] = useState("client");
  const [activeNav, setActiveNav] = useState("Overview");
  const [distributions, setDistributions] = useState(initialDistributions);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState("");
  const [panel, setPanel] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const timers = useRef(new Set());
  const progress = getProgress(distributions);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(timer);
  }, [toast]);
  function request(amount) {
    const id = crypto.randomUUID();
    setDistributions((previous) => [
      {
        id,
        amount,
        date: new Date().toISOString(),
        status: "processing",
        account: "Traditional IRA",
        ending: "4829",
      },
      ...previous,
    ]);
    setLastUpdated(new Date());
    setModal(false);
    setToast("Distribution requested. Your progress is already up to date.");
    const timer = setTimeout(() => {
      setDistributions((previous) =>
        previous.map((d) => (d.id === id ? { ...d, status: "completed" } : d)),
      );
      setLastUpdated(new Date());
      setToast(
        "Distribution completed. Your annual RMD progress has been updated.",
      );
      timers.current.delete(timer);
    }, 8000);
    timers.current.add(timer);
  }
  function exportHistory() {
    const csv = [
      "Date,Account,Amount,Status",
      ...distributions.map(
        (d) =>
          `${dateLabel(d.date).replace(",", "")},${d.account} ${d.ending},${d.amount},${d.status}`,
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `everwell-distributions-${PLAN_YEAR}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("Your distribution history has been exported.");
  }
  function navigate(name) {
    setActiveNav(name);
    setMobileNav(false);
    if (name === "Activity")
      setTimeout(
        () =>
          document
            .getElementById("distribution-history")
            ?.scrollIntoView({ behavior: "smooth" }),
        0,
      );
  }
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <a className="brand" href="#" onClick={() => navigate("Overview")}>
          <span className="brand-symbol">
            <Leaf size={25} />
          </span>
          <span>
            everwell<span className="brand-sub">W E A L T H</span>
          </span>
        </a>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          {navItems.map(([Icon, name]) => (
            <button
              key={name}
              className={`nav-item ${activeNav === name ? "active" : ""}`}
              onClick={() => navigate(name)}
            >
              <Icon size={19} />
              <span>{name}</span>
              {name === "Messages" && <span className="nav-count">2</span>}
              {activeNav === name && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="advisor-mini">
            <div className="advisor-avatar">
              JL
              <span />
            </div>
            <div>
              <strong>Here for your next chapter.</strong>
              <p>Your advisor is a click away.</p>
            </div>
            <button
              onClick={() => setPanel("advisor")}
              className="button advisor-contact"
            >
              Meet your advisor <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="nav-item" onClick={() => setPanel("support")}>
            <HelpCircle size={19} />
            Help & support
            <ArrowUpRight size={14} />
          </button>
          <button className="nav-item" onClick={() => setPanel("settings")}>
            <Settings size={19} />
            Settings
          </button>
          <div className="secure-label">
            <ShieldCheck size={13} /> YOUR FUTURE. SAFELY GUARDED.
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Toggle navigation"
              onClick={() => setMobileNav(!mobileNav)}
            >
              <Menu size={20} />
            </button>
            <span>
              {view === "advisor" ? "Advisor workspace" : "My workspace"}
            </span>
            <ChevronRight size={13} />
            <strong>
              {view === "advisor" ? "Client overview" : activeNav}
            </strong>
          </div>
          <div className="topbar-actions">
            <div className="view-switch" aria-label="Dashboard view">
              <button
                className={view === "client" ? "selected" : ""}
                onClick={() => setView("client")}
              >
                Client view
              </button>
              <button
                className={view === "advisor" ? "selected" : ""}
                onClick={() => setView("advisor")}
              >
                Advisor view
              </button>
            </div>
            <button
              className="notification-button icon-button"
              aria-label="View notifications"
              onClick={() => setPanel("notifications")}
            >
              <Bell size={19} />
              <span />
            </button>
            <span className="topbar-divider" />
            <button
              className="profile-button"
              onClick={() => setPanel("profile")}
            >
              <span className="avatar">MC</span>
              <span className="desktop-only">Margaret Chen</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow greeting">
                A CLEARER VIEW OF WHAT’S AHEAD
              </div>
              <h1>
                {view === "advisor"
                  ? "Margaret’s retirement, in view."
                  : "Good morning, Margaret"}
                {view === "client" && <span className="greeting-dot">.</span>}
              </h1>
              <p>
                {view === "advisor"
                  ? "Client profile · Margaret Chen · Household #EW-1042"
                  : "A little clarity for today. A little confidence for tomorrow."}
              </p>
            </div>
            <button className="year-picker" onClick={() => setPanel("year")}>
              <CalendarDays size={16} />
              {PLAN_YEAR} overview
              <ChevronDown size={14} />
            </button>
          </div>
          <div className="overview-strip">
            <div className="overview-icon">
              <Leaf size={19} />
            </div>
            <div>
              <strong>Your next chapter is taking shape.</strong>
              <span>
                {" "}
                Stay on top of your retirement, one simple step at a time.
              </span>
            </div>
            <span className="strip-tag">
              LET’S KEEP GROWING <ArrowUpRight size={14} />
            </span>
          </div>
          {activeNav === "Overview" || activeNav === "Activity" ? (
            <>
              <div className="summary-grid">
                <SummaryCard
                  title="Total retirement balance"
                  value="$842,560.00"
                  icon={<Wallet size={18} />}
                  footer={
                    <>
                      <span className="positive">↗ 4.8%</span>{" "}
                      <span>vs. last quarter</span>
                    </>
                  }
                />
                <SummaryCard
                  title="Annual RMD obligation"
                  value={money(ANNUAL_OBLIGATION, 2)}
                  icon={<CalendarDays size={18} />}
                  footer={
                    <>
                      <span className="tiny-dot" />
                      For the {PLAN_YEAR} tax year
                    </>
                  }
                />
                <SummaryCard
                  title="Remaining to distribute"
                  value={money(progress.remaining, 2)}
                  icon={<ArrowLeftRight size={18} />}
                  footer={
                    <>
                      <span className="tiny-dot amber-dot" />
                      {progress.status === "Satisfied"
                        ? "Annual requirement satisfied"
                        : `Due December 31, ${PLAN_YEAR}`}
                    </>
                  }
                />
              </div>
              <div className="dashboard-grid">
                <ProgressCard
                  progress={progress}
                  onRequest={() => setModal(true)}
                />
                <section className="insight-card">
                  <div className="insight-top">
                    <span className="insight-icon">
                      <Leaf size={20} />
                    </span>
                    <span>LOOKING AHEAD</span>
                  </div>
                  <h2>
                    More living.
                    <br />
                    Less wondering.
                  </h2>
                  <p>
                    Your required minimum distribution is one part of a bigger
                    picture. We’re here to help you see it all.
                  </p>
                  <div className="insight-art">
                    <span className="art-line line-1" />
                    <span className="art-line line-2" />
                    <span className="art-line line-3" />
                    <span className="art-sun" />
                  </div>
                  <button onClick={() => setPanel("plan")}>
                    Explore your retirement plan <ArrowUpRight size={17} />
                  </button>
                </section>
              </div>
              <div className="lower-grid">
                <DistributionHistory
                  distributions={distributions}
                  onExport={exportHistory}
                />
                <section className="card timeline-card">
                  <div className="eyebrow">YOUR YEAR AT A GLANCE</div>
                  <h2>Small steps. Steady progress.</h2>
                  <div className="timeline">
                    {[
                      {
                        title: "Annual RMD calculated",
                        detail: `${money(ANNUAL_OBLIGATION)} for ${PLAN_YEAR}`,
                        done: true,
                      },
                      {
                        title: "Distributions underway",
                        detail: `${money(progress.completed)} distributed to date`,
                        done: true,
                      },
                      {
                        title:
                          progress.status === "Satisfied"
                            ? "Annual requirement met"
                            : progress.inFlight
                              ? "Distribution in flight"
                              : "Your next distribution",
                        detail:
                          progress.status === "Satisfied"
                            ? "Your RMD is fully satisfied"
                            : progress.inFlight
                              ? `${money(progress.inFlight)} is processing`
                              : `${money(progress.remaining)} left to distribute`,
                        current: true,
                      },
                      {
                        title: "Finish the year with confidence",
                        detail: `December 31, ${PLAN_YEAR}`,
                      },
                    ].map((item, i) => (
                      <div
                        className={`timeline-item ${item.done ? "done" : ""} ${item.current ? "current" : ""}`}
                        key={i}
                      >
                        <span className="timeline-dot">
                          {item.done ? <CircleCheck size={17} /> : <span />}
                        </span>
                        <div>
                          <strong>{item.title}</strong>
                          <p>{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="timeline-note">
                    <Clock3 size={14} />
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </section>
              </div>
            </>
          ) : (
            <WorkspaceSection
              name={activeNav}
              onRequest={() => setModal(true)}
              onContact={() => setPanel("advisor")}
              available={progress.available}
            />
          )}
          <div className="bottom-note">
            <ShieldCheck size={15} />
            <span>A thoughtful approach. A secure experience. Always.</span>
            <span className="demo-label">DEMO EXPERIENCE · SAMPLE DATA</span>
          </div>
          <footer className="page-footer">
            <span>
              © {PLAN_YEAR} Everwell Wealth. Your future, thoughtfully planned.
            </span>
            <div>
              <button onClick={() => setPanel("privacy")}>
                Privacy policy
              </button>
              <span>·</span>
              <button onClick={() => setPanel("disclosures")}>
                Disclosures
              </button>
            </div>
          </footer>
        </main>
      </div>
      {modal && (
        <RequestModal
          available={progress.available}
          onClose={() => setModal(false)}
          onSubmit={request}
        />
      )}
      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={19} />
          {toast}
          <button
            className="icon-button"
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {panel && <InfoPanel name={panel} onClose={() => setPanel(null)} />}
    </div>
  );
}

function SummaryCard({ title, value, icon, footer }) {
  return (
    <section className="card summary-card">
      <div className="summary-title">
        {title}
        <span>{icon}</span>
      </div>
      <div className="summary-value">{value}</div>
      <div className="summary-footer">{footer}</div>
    </section>
  );
}

function WorkspaceSection({ name, onRequest, onContact, available }) {
  return (
    <section className="card workspace-section">
      <div className="eyebrow">YOUR WORKSPACE</div>
      <h2>{name}</h2>
      {name === "Accounts" ? (
        <>
          <p className="muted">
            Your retirement accounts, together in one place.
          </p>
          <div className="account-row">
            <span className="transaction-icon">
              <Wallet size={22} />
            </span>
            <div>
              <strong>Traditional IRA ••4829</strong>
              <p className="muted">Retirement · RMD eligible</p>
            </div>
            <strong>$842,560.00</strong>
          </div>
          <button
            className="button primary"
            disabled={!available}
            onClick={onRequest}
          >
            Request a distribution <ArrowUpRight size={16} />
          </button>
        </>
      ) : name === "Documents" ? (
        <>
          <p className="muted">
            Your {PLAN_YEAR} RMD statement will be available here after the end
            of the tax year.
          </p>
          <div className="empty-state">
            <FileText size={30} />
            <h3>You’re all caught up.</h3>
            <p>No new documents to review.</p>
          </div>
        </>
      ) : (
        <>
          <p className="muted">A note from your advisor, Jessica Lewis</p>
          <div className="message-box">
            <strong>Your annual RMD check-in</strong>
            <p>
              Hi Margaret, you’re making great progress toward your annual
              distribution. Let’s connect if you’d like to review your next
              step.
            </p>
            <span>November 10, {PLAN_YEAR} · Sample message</span>
          </div>
          <button className="button primary" onClick={onContact}>
            Contact your advisor <ArrowUpRight size={16} />
          </button>
        </>
      )}
    </section>
  );
}

function InfoPanel({ name, onClose }) {
  const content = {
    advisor: [
      "A familiar face for your future.",
      "Jessica Lewis, CFP®",
      "Your dedicated wealth advisor. Schedule a conversation at jessica.lewis@example.com or call (555) 010-2048. Demo contact information only.",
    ],
    support: [
      "How can we help?",
      "You’re in good hands.",
      "For this demo, explore your dashboard, request a simulated distribution, or switch to the advisor view to see synchronized progress.",
    ],
    settings: [
      "Your preferences",
      "Designed around you.",
      "This demo displays US dollars and the 2026 tax year. Session data resets when you reload. No personal information is stored.",
    ],
    notifications: [
      "You’re up to date.",
      "Your retirement updates",
      "Your annual RMD is due December 31, 2026. Distribution requests update immediately; demo requests settle in 8 seconds.",
    ],
    profile: [
      "Your profile",
      "Margaret Chen",
      "Client since 2018 · Household #EW-1042. This is a fictional profile created for the Everwell dashboard demonstration.",
    ],
    year: [
      "2026 overview",
      "One year. A clearer picture.",
      "This sample dashboard includes the 2026 tax year. Other tax years are not included in this demo.",
    ],
    plan: [
      "Your retirement plan",
      "Make room for what matters.",
      "Your annual distribution plan is $24,000, with quarterly distributions of $6,000. Your advisor can help coordinate distributions with your wider retirement goals.",
    ],
    privacy: [
      "Your privacy matters.",
      "Sample data. Real care.",
      "This demo uses fictional account details and keeps all distribution activity in browser memory. It does not connect to a bank or transmit your financial information.",
    ],
    disclosures: [
      "A note about this demo",
      "For demonstration only.",
      "This dashboard is not financial or tax advice. RMD obligations are sample values, not calculated from IRS tables. Consult a qualified professional about your own requirements.",
    ],
  }[name];
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog className="modal info-modal" ref={ref} onCancel={onClose}>
      <div className="section-heading">
        <div className="eyebrow">EVERWELL WEALTH</div>
        <button
          className="icon-button"
          aria-label="Close details"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <span className="info-leaf">
        <Leaf size={30} />
      </span>
      <h2>{content[0]}</h2>
      <h3>{content[1]}</h3>
      <p className="muted">{content[2]}</p>
      <button className="button primary" onClick={onClose}>
        Back to your dashboard <ArrowRight size={16} />
      </button>
    </dialog>
  );
}

if (document.getElementById("root"))
  createRoot(document.getElementById("root")).render(<App />);
