from pathlib import Path
import html
root=Path(__file__).resolve().parents[3]
source=Path(__file__).with_name('report.template.html').read_text(encoding='utf-8')
data=(root/'work/edges-report/data.json').read_text(encoding='utf-8').replace('</','<\\/')
notice=(root/'server/versions/EDGE-LETTERS-NOTICE.txt').read_text(encoding='utf-8')
(root/'work/edges-report/index.html').write_bytes(source.replace('__DATA__',data).replace('__NOTICE__',html.escape(notice)).encode('utf-8'))
print('Standalone report generated.')
