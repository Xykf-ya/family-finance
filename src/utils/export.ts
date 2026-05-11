import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function exportAsImage(element: HTMLElement, filename = '家庭财务摘要'): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#FAF7F2',
      logging: false,
    })

    const link = document.createElement('a')
    link.download = `${filename}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (e) {
    console.error('导出图片失败', e)
    alert('导出失败，请重试')
  }
}

export async function exportAsPDF(element: HTMLElement, filename = '家庭财务摘要'): Promise<void> {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#FAF7F2',
      logging: false,
    })

    const imgWidth = 210 // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const pdf = new jsPDF('p', 'mm', 'a4')
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, Math.min(imgHeight, 297))
    pdf.save(`${filename}.pdf`)
  } catch (e) {
    console.error('导出PDF失败', e)
    alert('导出失败，请重试')
  }
}
