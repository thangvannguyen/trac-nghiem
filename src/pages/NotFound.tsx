import { Link } from 'react-router-dom';
import { Owl } from '../icons';

export default function NotFound({ title = 'Không tìm thấy trang', message }: { title?: string; message?: string }) {
  return (
    <div className="card mx-auto mt-6 flex max-w-md flex-col items-center gap-3 p-8 text-center">
      <Owl size={110} mood="sad" />
      <h1 className="text-2xl font-black">{title}</h1>
      <p className="text-ink/60">{message ?? 'Có thể đường dẫn đã sai hoặc nội dung đã bị xóa.'}</p>
      <Link to="/" className="btn-primary mt-2">
        Về trang chủ
      </Link>
    </div>
  );
}
