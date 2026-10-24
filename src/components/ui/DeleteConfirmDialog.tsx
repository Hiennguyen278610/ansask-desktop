import { Dialog } from './Dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDanger?: boolean;
}

export function DeleteConfirmDialog({ open, onClose, onConfirm, title, message, isDanger = true }: Props) {
  return (
    <Dialog open={open} title={title} onClose={onClose}
      footer={
        <>
          <button onClick={onClose} className="neu-pill px-4 py-2 rounded-xl text-xs font-bold text-slate-600">Hủy</button>
          <button onClick={() => { onConfirm(); onClose(); }}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white ${isDanger ? 'bg-rose-600 hover:bg-rose-700' : 'neu-dark-btn'}`}>
            Xác nhận
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{message}</p>
    </Dialog>
  );
}
