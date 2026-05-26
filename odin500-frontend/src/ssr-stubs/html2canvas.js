export default function html2canvas() {
  return Promise.reject(new Error('html2canvas is not available during SSR'));
}
