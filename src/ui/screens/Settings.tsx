import { useRef, useState } from 'react';
import { getContent, type Difficulty } from '../../sim';
import { t } from '../../i18n';
import { exportCode, importCode, type SaveData } from '../../platform/save';
import { useGame } from '../../store/game';
import { InstallInfo, UpdateNotice } from '../components/PwaNotices';

const IDS: Difficulty[] = ['easy', 'normal', 'hard'];

const summary = (s: SaveData) => `${Object.keys(s.days).length} ngày, ${s.codex.length} thẻ`;

/**
 * S13 Cài đặt. Mở từ Sảnh (đầy đủ) hoặc từ Menu tạm dừng (chỉ phần an toàn giữa ca: chuyển động,
 * xuất mã, giới thiệu; không đổi độ khó, nhập/xóa tiến trình, không hiện "Có bản mới").
 */
export function Settings() {
  const save = useGame((s) => s.save);
  const difficulty = useGame((s) => s.difficulty);
  const from = useGame((s) => s.settingsFrom);
  const { setDifficulty, setSetting, go } = useGame.getState();
  const inShift = from === 'room';
  const levels = getContent().difficulty.levels;
  const osReduced =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <>
      <div className="screen">
        <h1>⚙️ Cài đặt</h1>
        {!inShift && <UpdateNotice />}

        {!inShift && (
          <section className="card stack" aria-labelledby="st-difficulty">
            <h3 id="st-difficulty">Độ khó</h3>
            <div className="row" role="radiogroup" aria-labelledby="st-difficulty">
              {IDS.map((id) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={difficulty === id}
                  className={`grow ${difficulty === id ? 'primary' : ''}`}
                  onClick={() => setDifficulty(id)}
                >
                  {levels[id].name}
                </button>
              ))}
            </div>
            <ul className="muted notes">
              {IDS.map((id) => (
                <li key={id}>
                  <b>{levels[id].name}:</b> {levels[id].note}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card stack" aria-labelledby="st-motion">
          <h3 id="st-motion">Hiệu ứng</h3>
          <div className="row">
            <span className="grow">Giảm chuyển động</span>
            <button
              role="switch"
              aria-checked={save.settings.reducedMotion}
              aria-label="Giảm chuyển động"
              className={save.settings.reducedMotion ? 'primary' : ''}
              onClick={() => setSetting({ reducedMotion: !save.settings.reducedMotion })}
            >
              {save.settings.reducedMotion ? 'Bật' : 'Tắt'}
            </button>
          </div>
          <span className="muted">
            Tắt hoạt ảnh và hiệu ứng chuyển.
            {osReduced && ' Máy bạn đã bật giảm chuyển động nên game luôn theo cài đặt máy.'}
          </span>
        </section>

        <ExportSection save={save} />
        {!inShift && <ImportSection />}

        <section className="card stack" aria-labelledby="st-install">
          <h3 id="st-install">Cài app, chơi offline</h3>
          <InstallInfo />
        </section>

        {!inShift && <ResetSection />}

        <section className="card stack" aria-labelledby="st-about">
          <h3 id="st-about">Giới thiệu</h3>
          <p>
            CA TRỰC LABO là game giáo dục về công việc của kỹ thuật viên xét nghiệm. Game không chẩn đoán bệnh
            và không thay thế quy trình hay tư vấn y tế.
          </p>
          <p>
            Game không thu thập dữ liệu cá nhân và không có quảng cáo. Tiến trình chỉ lưu trên máy của bạn.
          </p>
          <p className="muted">{t('disclaimer')}</p>
        </section>
      </div>
      <nav className="bottombar" aria-label="Điều hướng">
        <button className="primary" onClick={() => go(inShift ? 'room' : 'home')}>
          ↩ {inShift ? 'Về ca trực' : 'Về sảnh'}
        </button>
      </nav>
    </>
  );
}

function ExportSection({ save }: { save: SaveData }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const area = useRef<HTMLTextAreaElement>(null);
  const code = open ? exportCode(save) : '';

  const selectAll = () => {
    area.current?.focus();
    area.current?.select();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setStatus('Đã sao chép mã lưu.');
    } catch {
      selectAll();
      setStatus('Không tự sao chép được. Mã đã được chọn sẵn, hãy giữ ngón tay trên mã rồi chọn Sao chép.');
    }
  };

  return (
    <section className="card stack" aria-labelledby="st-export">
      <h3 id="st-export">Xuất mã lưu</h3>
      <span className="muted">
        Mã là bản sao tiến trình ({summary(save)}). Cất ở nơi an toàn để khôi phục khi đổi máy.
      </span>
      {!open ? (
        <button onClick={() => setOpen(true)}>Xuất mã lưu</button>
      ) : (
        <>
          <textarea
            ref={area}
            className="codebox"
            readOnly
            rows={5}
            value={code}
            aria-label="Mã lưu"
            onFocus={(e) => e.currentTarget.select()}
          />
          <div className="row wrap">
            <button className="grow primary" onClick={() => void copy()}>
              Sao chép
            </button>
            <button
              className="grow"
              onClick={() => {
                setOpen(false);
                setStatus('');
              }}
            >
              Ẩn mã
            </button>
          </div>
          <span className="muted" role="status">
            {status}
          </span>
        </>
      )}
    </section>
  );
}

function ImportSection() {
  const current = useGame((s) => s.save);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<SaveData | null>(null);
  const [done, setDone] = useState(false);

  const check = () => {
    setDone(false);
    const r = importCode(text);
    if (r.ok) {
      setError('');
      setPending(r.save);
    } else {
      setPending(null);
      setError(r.error);
    }
  };

  return (
    <section className="card stack" aria-labelledby="st-import">
      <h3 id="st-import">Nhập mã lưu</h3>
      <textarea
        className="codebox"
        rows={4}
        value={text}
        placeholder="Dán mã lưu (bắt đầu bằng CTL1.) vào đây"
        aria-label="Mã lưu cần nhập"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        onChange={(e) => {
          setText(e.target.value);
          setPending(null);
          setError('');
          setDone(false);
        }}
      />
      <button onClick={check} disabled={text.trim() === ''}>
        Nhập
      </button>
      {error && (
        <div className="callout bad" role="alert">
          {error}
        </div>
      )}
      {pending && (
        <div className="callout stack" role="alert">
          <span>
            Mã hợp lệ: <b>{summary(pending)}</b>. Tiến trình hiện tại ({summary(current)}) sẽ bị thay bằng bản
            này và không hoàn lại được.
          </span>
          <div className="row wrap">
            <button
              className="grow danger"
              onClick={() => {
                useGame.getState().importSave(pending);
                setPending(null);
                setText('');
                setDone(true);
              }}
            >
              Ghi đè
            </button>
            <button className="grow" onClick={() => setPending(null)}>
              Hủy
            </button>
          </div>
        </div>
      )}
      {done && (
        <div className="callout good" role="status">
          Đã khôi phục tiến trình.
        </div>
      )}
    </section>
  );
}

function ResetSection() {
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState(false);
  return (
    <section className="card stack" aria-labelledby="st-reset">
      <h3 id="st-reset">Xóa tiến trình</h3>
      <span className="muted">Xóa sao, điểm, ngày đã chơi, Sổ tay và ngân sách. Nên xuất mã lưu trước.</span>
      {!confirm ? (
        <button
          className="danger"
          onClick={() => {
            setDone(false);
            setConfirm(true);
          }}
        >
          Xóa tiến trình
        </button>
      ) : (
        <div className="callout bad stack" role="alert">
          <b>Xóa hết tiến trình?</b>
          <span>Việc này không hoàn lại được.</span>
          <div className="row wrap">
            <button
              className="grow danger"
              onClick={() => {
                useGame.getState().resetSave();
                setConfirm(false);
                setDone(true);
              }}
            >
              Xóa hết
            </button>
            <button className="grow" onClick={() => setConfirm(false)}>
              Giữ lại
            </button>
          </div>
        </div>
      )}
      {done && (
        <div className="callout good" role="status">
          Đã xóa tiến trình.
        </div>
      )}
    </section>
  );
}
