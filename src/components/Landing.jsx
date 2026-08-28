export default function Landing({ name, onStart, onEdit }) {
  return (
    <div className="screen">
      <div className="landing-wrap">
        <div>
          <div className="landing-title">
            Ready to<br />
            Train,{' '}<span className="landing-name">{name}</span>.
          </div>
          <div className="landing-sub">Let's get it.</div>
        </div>
      </div>
      <div className="landing-btns">
        <button className="btn btn-primary" onClick={onStart}>
          Start Session
        </button>
        <button className="btn btn-secondary" onClick={onEdit}>
          Edit Plan
        </button>
      </div>
    </div>
  )
}
