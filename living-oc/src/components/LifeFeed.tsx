import { useLiving } from '../store/useLiving';
export default function LifeFeed() {
  useLiving((s) => s.version);
  const { day } = useLiving.getState();
  const live = useLiving((s) => s.liveADay);
  return (
    <section className="lifefeed">
      <div className="col-head">中景 · 它今天的人生</div>
      <button className="btn" onClick={() => live()}>让它过一天 ›</button>
      {day && (
        <>
          <ol className="feed">
            {day.events.map((e, i) => (
              <li key={i} className={'ev imp-' + (e.importance >= 7 ? 'hi' : 'lo')}>{e.text}</li>
            ))}
          </ol>
          <pre className="diary">{day.diary}</pre>
        </>
      )}
    </section>
  );
}
