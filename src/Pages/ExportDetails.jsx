import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import ExcelJS from "exceljs";
import { AlertCircle, BarChart3, CalendarDays, CheckCircle2, Download, FileSpreadsheet, FileText, Loader2, RefreshCw, TrendingDown, TrendingUp, WalletCards, X } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const API_ROOT = (import.meta.env.VITE_API_URL || "https://express-project-learning-new.onrender.com/api").replace(/\/$/, "");
const EXPORT_API_URL = `${API_ROOT}/export-details`;
const token = () => localStorage.getItem("token") || localStorage.getItem("accessToken") || localStorage.getItem("auth_token") || "";
const monthValue = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
const monthName = d => d.toLocaleDateString("en-IN", { month:"long", year:"numeric" });
const money = v => new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", minimumFractionDigits:0, maximumFractionDigits:0 }).format(Number(v)||0);
const pdfMoney = v => `INR ${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v)||0)}`;
const n = v => Number(v)||0;
const blobDownload = async (blob, name, mimeType = "") => {
  const file = new File([blob], name, {
    type: mimeType || blob.type || "application/octet-stream",
  });

  // Use the device share sheet when supported (useful for mobile/WebView).
  if (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        title: name,
        files: [file],
      });
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();
  a.remove();

  window.setTimeout(
    () => URL.revokeObjectURL(url),
    30000
  );
};

export default function ExportDetails(){
  const [selectedMonth,setSelectedMonth]=useState(new Date());
  const [report,setReport]=useState(null);
  const [loading,setLoading]=useState(true);
  const [downloading,setDownloading]=useState("");
  const [error,setError]=useState("");
  const [toast,setToast]=useState("");
  const headers=useMemo(()=>({Authorization:`Bearer ${token()}`,"Content-Type":"application/json"}),[]);

  const load=useCallback(async()=>{
    setLoading(true); setError("");
    try{
      const r=await axios.get(EXPORT_API_URL,{params:{month:monthValue(selectedMonth)},headers});
      if(!r.data?.success) throw new Error(r.data?.error||"Invalid export response");
      setReport(r.data.data);
    }catch(e){ setReport(null); setError(e?.response?.data?.error||e.message||"Unable to load report."); }
    finally{setLoading(false);}
  },[selectedMonth,headers]);
  useEffect(()=>{load();},[load]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(""),2200);return()=>clearTimeout(t)},[toast]);

  const s=report?.summary||{};
  const categories=Array.isArray(report?.expenses?.categories)?report.expenses.categories:[];
  const result=s.result==="profit"?"Profit":s.result==="loss"?"Loss":"Break Even";
  const tone=s.result==="profit"?"profit":s.result==="loss"?"loss":"break";
  const changeMonth=delta=>setSelectedMonth(cur=>{const x=new Date(cur);x.setMonth(x.getMonth()+delta);return x;});
  const rows=[
    ["Work Payment",money(s.work_payment)],["Business Payment",money(s.business_payment)],
    ["Total Income",money(s.total_income)],["Total Borrow",money(s.total_borrow)],
    ["Total Loan",money(s.total_loan)],["Total Expenses",money(s.total_expenses)],
    ["Total EMI Paid",money(s.total_emi_paid)],["Monthly Savings",money(s.total_savings)],
    ["Savings Rate",`${Math.round(n(s.savings_rate))}%`],["Month Result",result]
  ];

  const exportText=async()=>{
    if(!report)return; setDownloading("text");
    try{
      const lines=["======================================================================","                            MONTH REPORT","======================================================================",`Month       : ${report.report.month}`,`Period      : ${report.report.month_start} to ${report.report.month_end}`,"","SUMMARY","----------------------------------------------------------------------",...rows.map(x=>`${x[0].padEnd(20," ")} : ${x[1]}`),"","EXPENSES BY CATEGORY","----------------------------------------------------------------------",...(categories.length?categories.map(x=>`${String(x.category_name).padEnd(28," ")} ${money(x.total_amount)}`):["No expenses recorded for this month."]),"","======================================================================"];
      await blobDownload(new Blob([lines.join("\n")],{type:"text/plain;charset=utf-8"}),`Month_Report_${monthValue(selectedMonth)}.txt`,"text/plain;charset=utf-8"); setToast("Text report downloaded.");
    }catch(e){setError("Unable to create text report.");}finally{setDownloading("");}
  };

  const exportExcel=async()=>{
    if(!report) return; setDownloading("excel"); setError("");
    try{
      const workbook=new ExcelJS.Workbook();
      workbook.creator="Personal Dashboard";
      workbook.lastModifiedBy="Personal Dashboard";
      workbook.created=new Date();
      workbook.modified=new Date();
      workbook.properties.title=`Month Report - ${report.report.month}`;

      const navy="18233A", blue="2563EB", teal="0F766E", green="10B981", red="EF4444", orange="F59E0B";
      const white="FFFFFF", light="F8FAFC", line="D9E2EC", dark="172033", muted="64748B";

      const ws=workbook.addWorksheet("Month Report",{views:[{state:"frozen",ySplit:6}]});
      ws.columns=[{width:32},{width:28}];
      ws.mergeCells("A1:B1"); ws.getCell("A1").value="MONTH REPORT";
      ws.getCell("A1").font={name:"Aptos Display",size:20,bold:true,color:{argb:white}};
      ws.getCell("A1").fill={type:"pattern",pattern:"solid",fgColor:{argb:navy}};
      ws.getCell("A1").alignment={vertical:"middle",horizontal:"left"}; ws.getRow(1).height=34;
      ws.mergeCells("A2:B2"); ws.getCell("A2").value=report.report.month;
      ws.getCell("A2").font={name:"Aptos",size:13,bold:true,color:{argb:blue}};
      ws.mergeCells("A3:B3"); ws.getCell("A3").value=`Period: ${report.report.month_start} to ${report.report.month_end}`;
      ws.getCell("A3").font={name:"Aptos",size:10,color:{argb:muted}};
      ws.mergeCells("A5:B5"); ws.getCell("A5").value="FINANCIAL SUMMARY";
      ws.getCell("A5").font={name:"Aptos",size:11,bold:true,color:{argb:white}};
      ws.getCell("A5").fill={type:"pattern",pattern:"solid",fgColor:{argb:blue}}; ws.getRow(5).height=22;

      const excelRows=[
        ["Work Payment",Number(s.work_payment)||0],["Business Payment",Number(s.business_payment)||0],
        ["Total Income",Number(s.total_income)||0],["Total Borrow",Number(s.total_borrow)||0],
        ["Total Loan",Number(s.total_loan)||0],["Total Expenses",Number(s.total_expenses)||0],
        ["Total EMI Paid",Number(s.total_emi_paid)||0],["Monthly Savings",Number(s.total_savings)||0],
        ["Savings Rate",(Number(s.savings_rate)||0)/100],["Month Result",result]
      ];
      excelRows.forEach(([label,val],i)=>{
        const row=ws.addRow([label,val]);
        row.eachCell(cell=>{cell.font={name:"Aptos",size:10,color:{argb:dark}};cell.border={bottom:{style:"thin",color:{argb:line}}};cell.alignment={vertical:"middle"};});
        if(typeof val==="number") row.getCell(2).numFmt=(label==="Savings Rate"?"0%":'₹#,##0');
        row.getCell(2).alignment={horizontal:"right"};
        if(i%2===1) row.eachCell(cell=>cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:light}});
        if(label==="Monthly Savings"){
          const col=s.result==="profit"?green:s.result==="loss"?red:orange;
          row.eachCell(cell=>{cell.font={name:"Aptos",size:10,bold:true,color:{argb:col}};cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:s.result==="profit"?"ECFDF5":"FEF2F2"}};});
        }
      });

      const cat=workbook.addWorksheet("Expense Categories",{views:[{state:"frozen",ySplit:4}]});
      cat.columns=[{width:34},{width:22},{width:18}];
      cat.mergeCells("A1:C1");cat.getCell("A1").value="EXPENSES BY CATEGORY";cat.getCell("A1").font={name:"Aptos Display",size:18,bold:true,color:{argb:white}};cat.getCell("A1").fill={type:"pattern",pattern:"solid",fgColor:{argb:navy}};cat.getRow(1).height=32;
      cat.mergeCells("A2:C2");cat.getCell("A2").value=report.report.month;cat.getCell("A2").font={name:"Aptos",size:11,bold:true,color:{argb:blue}};
      const hdr=cat.addRow(["Category","Amount","Transactions"]);
      hdr.eachCell(cell=>{cell.font={name:"Aptos",size:10,bold:true,color:{argb:white}};cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:teal}};cell.alignment={horizontal:"center",vertical:"middle"};});
      if(categories.length){categories.forEach((item,idx)=>{const row=cat.addRow([item.category_name,Number(item.total_amount)||0,Number(item.expense_count)||0]);row.getCell(2).numFmt='₹#,##0';row.getCell(2).alignment={horizontal:"right"};row.getCell(3).alignment={horizontal:"center"};row.eachCell(cell=>{cell.font={name:"Aptos",size:10,color:{argb:dark}};cell.border={bottom:{style:"thin",color:{argb:line}}};if(idx%2===1)cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:light}};});});}else{const row=cat.addRow(["No expenses recorded",0,0]);row.getCell(2).numFmt='₹#,##0';}
      const totalRow=cat.addRow(["TOTAL",Number(s.total_expenses)||0,Number(s.expense_count)||0]);totalRow.eachCell(cell=>{cell.font={name:"Aptos",size:10,bold:true,color:{argb:dark}};cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"EFF6FF"}};cell.border={top:{style:"medium",color:{argb:blue}}};});totalRow.getCell(2).numFmt='₹#,##0';totalRow.getCell(2).alignment={horizontal:"right"};totalRow.getCell(3).alignment={horizontal:"center"};
      cat.autoFilter={from:"A3",to:"C3"};

      const info=workbook.addWorksheet("Report Info"); info.columns=[{width:28},{width:65}];
      [["Property","Value"],["Report","Month Report"],["Month",report.report.month],["Period",`${report.report.month_start} to ${report.report.month_end}`],["Result",result],["Generated","Personal Dashboard"]].forEach((r,i)=>{const row=info.addRow(r);row.eachCell(cell=>{cell.font={name:"Aptos",size:10,bold:i===0,color:{argb:i===0?white:dark}};if(i===0)cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:navy}};});});

      const buffer=await workbook.xlsx.writeBuffer();
      await blobDownload(new Blob([buffer],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),`Month_Report_${monthValue(selectedMonth)}.xlsx`,"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      setToast("Professional Excel report downloaded.");
    }catch(e){console.error(e);setError(e?.message||"Excel export failed. Install exceljs with: npm install exceljs");}
    finally{setDownloading("");}
  };

  const exportPdf=async()=>{
    if(!report) return; setDownloading("pdf"); setError("");
    try{
      const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
      const W=doc.internal.pageSize.getWidth(), H=doc.internal.pageSize.getHeight(), M=15;
      const navy=[24,35,58], blue=[37,99,235], teal=[15,118,110], green=[16,185,129], red=[239,68,68], orange=[245,158,11], light=[248,250,252], text=[23,32,51], muted=[100,116,139], border=[226,232,240];
      const header=()=>{doc.setFillColor(...navy);doc.rect(0,0,W,35,"F");doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(21);doc.text("Month Report",M,14);doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(219,234,254);doc.text(report.report.month,M,22);doc.setFontSize(8.5);doc.text(`Period: ${report.report.month_start} to ${report.report.month_end}`,M,29);doc.setFont("helvetica","bold");doc.setFontSize(7.5);doc.setTextColor(165,180,252);doc.text("PERSONAL DASHBOARD",W-M,16,{align:"right"});};
      const footer=(page)=>{doc.setDrawColor(...border);doc.setLineWidth(.2);doc.line(M,H-14,W-M,H-14);doc.setTextColor(...muted);doc.setFont("helvetica","normal");doc.setFontSize(7.2);doc.text("Generated from Personal Dashboard",M,H-8);doc.text(`Page ${page}`,W-M,H-8,{align:"right"});};
      header();
      doc.setTextColor(...text);doc.setFont("helvetica","bold");doc.setFontSize(12);doc.text("Financial Summary",M,47);
      const gap=5, cw=(W-M*2-gap)/2, ch=18;
      const cards=[["Work Payment",pdfMoney(s.work_payment),blue],["Business Payment",pdfMoney(s.business_payment),teal],["Total Income",pdfMoney(s.total_income),blue],["Total Borrow",pdfMoney(s.total_borrow),orange],["Total Loan",pdfMoney(s.total_loan),[124,58,237]],["Total Expenses",pdfMoney(s.total_expenses),red],["Total EMI Paid",pdfMoney(s.total_emi_paid),[99,102,241]],["Monthly Savings",pdfMoney(s.total_savings),s.result==="profit"?green:s.result==="loss"?red:orange]];
      cards.forEach((c,i)=>{const x=M+(i%2)*(cw+gap),y=53+Math.floor(i/2)*(ch+4);doc.setFillColor(...light);doc.setDrawColor(...border);doc.roundedRect(x,y,cw,ch,3,3,"FD");doc.setFillColor(...c[2]);doc.roundedRect(x,y,3,ch,1.2,1.2,"F");doc.setTextColor(...muted);doc.setFont("helvetica","normal");doc.setFontSize(7.4);doc.text(c[0],x+8,y+7);doc.setTextColor(...text);doc.setFont("helvetica","bold");doc.setFontSize(9.6);doc.text(c[1],x+cw-8,y+12.5,{align:"right"});});
      let y=53+4*(ch+4)+5;
      const rc=s.result==="profit"?green:s.result==="loss"?red:orange;doc.setFillColor(...rc);doc.roundedRect(M,y,W-M*2,25,4,4,"F");doc.setTextColor(255,255,255);doc.setFont("helvetica","bold");doc.setFontSize(8);doc.text("MONTH-END RESULT",M+8,y+8);doc.setFontSize(14);doc.text(`${result}: ${pdfMoney(s.total_savings)}`,M+8,y+17);doc.setFont("helvetica","normal");doc.setFontSize(8.3);doc.text(`Savings Rate: ${Math.round(n(s.savings_rate))}%`,W-M-8,y+12,{align:"right"});
      y+=35;doc.setTextColor(...text);doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("Expenses by Category",M,y);
      const body=categories.length?categories.map(x=>[String(x.category_name),pdfMoney(x.total_amount),String(x.expense_count||0)]):[["No expenses recorded",pdfMoney(0),"0"]];
      autoTable(doc,{startY:y+5,margin:{left:M,right:M},head:[["Category","Amount","Transactions"]],body,theme:"grid",rowPageBreak:"avoid",headStyles:{fillColor:teal,textColor:[255,255,255],fontStyle:"bold",fontSize:8.5,cellPadding:3.4},bodyStyles:{fontSize:8.5,textColor:text,cellPadding:3.4},alternateRowStyles:{fillColor:[249,250,251]},styles:{lineColor:border,lineWidth:.2,overflow:"linebreak",valign:"middle"},columnStyles:{0:{cellWidth:95},1:{cellWidth:55,halign:"right"},2:{cellWidth:30,halign:"center"}}});
      y=doc.lastAutoTable.finalY+10; if(y>H-38){doc.addPage();header();y=46;}
      doc.setFillColor(241,245,249);doc.setDrawColor(...border);doc.roundedRect(M,y,W-M*2,24,4,4,"FD");doc.setTextColor(...muted);doc.setFont("helvetica","bold");doc.setFontSize(7);doc.text("REPORT TOTALS",M+8,y+8);doc.setTextColor(...text);doc.setFont("helvetica","normal");doc.setFontSize(8.3);doc.text(`Income ${pdfMoney(s.total_income)}`,M+8,y+16);doc.text(`Expenses ${pdfMoney(s.total_expenses)}`,M+78,y+16);doc.text(`EMI ${pdfMoney(s.total_emi_paid)}`,M+153,y+16);
      for(let page=1;page<=doc.getNumberOfPages();page++){doc.setPage(page);footer(page);} await blobDownload(doc.output("blob"),`Month_Report_${monthValue(selectedMonth)}.pdf`,"application/pdf"); setToast("Professional PDF report downloaded.");
    }catch(e){console.error(e);setError(e?.message||"PDF export failed. Install jspdf and jspdf-autotable");} finally{setDownloading("");}
  };

  return <><style>{styles}</style><main className="ed-page"><div className="ed-shell">
    <header className="ed-header"><div><div className="ed-eyebrow"><FileText size={13}/> EXPORT CENTER</div><h1>Month Report</h1><p>Select a month and download a clean financial report.</p></div><button className="ed-refresh" onClick={load} disabled={loading}><RefreshCw size={15} className={loading?"ed-spin":""}/><span>Refresh</span></button></header>
    <section className="ed-month"><div><span>REPORT MONTH</span><strong>{monthName(selectedMonth)}</strong></div><div className="ed-month-control"><button onClick={()=>changeMonth(-1)}>‹</button><label><CalendarDays size={15}/><input type="month" value={monthValue(selectedMonth)} onChange={e=>{const [y,m]=e.target.value.split("-").map(Number);if(y&&m)setSelectedMonth(new Date(y,m-1,1));}}/></label><button onClick={()=>changeMonth(1)}>›</button></div></section>
    {error&&<div className="ed-error"><AlertCircle size={16}/><div><b>Report Error</b><span>{error}</span></div><button onClick={()=>setError("")}><X size={13}/></button></div>}
    {loading?<section className="ed-loading"><Loader2 size={28} className="ed-spin"/><b>Preparing Month Report</b><span>Loading selected month...</span></section>:report&&<>
      <section className="ed-metrics"><Metric t="Work Payment" v={money(s.work_payment)} i={<WalletCards/>} c="green"/><Metric t="Business Payment" v={money(s.business_payment)} i={<TrendingUp/>} c="blue"/><Metric t="Total Borrow" v={money(s.total_borrow)} i={<WalletCards/>} c="orange"/><Metric t="Total Loan" v={money(s.total_loan)} i={<WalletCards/>} c="purple"/><Metric t="Total Expenses" v={money(s.total_expenses)} i={<TrendingDown/>} c="red"/><Metric t="Monthly Savings" v={money(s.total_savings)} i={<TrendingUp/>} c={tone}/></section>
      <section className={`ed-result ${tone}`}><div><span>MONTH-END RESULT</span><strong>{result}: {money(s.total_savings)}</strong><small>Income − Expenses − EMI Paid</small></div><b>{n(s.savings_rate).toFixed(2)}%</b></section>
      <section className="ed-card"><div className="ed-card-head"><div><h2>Expenses by Category</h2><p>{categories.length} categories</p></div><BarChart3 size={17}/></div>{categories.length?<div className="ed-table-wrap"><table><thead><tr><th>Category</th><th>Transactions</th><th>Amount</th></tr></thead><tbody>{categories.map(x=><tr key={x.category_id}><td>{x.category_name}</td><td>{x.expense_count}</td><td>{money(x.total_amount)}</td></tr>)}</tbody><tfoot><tr><th>Total</th><th>{s.expense_count}</th><th>{money(s.total_expenses)}</th></tr></tfoot></table></div>:<div className="ed-empty">No expenses recorded for this month.</div>}</section>
      <section className="ed-download"><div><div className="ed-eyebrow dark">DOWNLOAD</div><h2>{report.report.month} report</h2><p>Download the selected month using the same report data.</p></div><div className="ed-buttons"><DownloadButton title="PDF" sub="Professional report" icon={<FileText/>} load={downloading==="pdf"} click={exportPdf} c="pdf"/><DownloadButton title="Excel" sub="Editable spreadsheet" icon={<FileSpreadsheet/>} load={downloading==="excel"} click={exportExcel} c="excel"/><DownloadButton title="Text" sub="Simple text report" icon={<FileText/>} load={downloading==="text"} click={exportText} c="text"/></div></section>
    </>}
  </div></main>{toast&&<div className="ed-toast"><CheckCircle2 size={16}/>{toast}</div>}</>;
}

function Metric({t,v,i,c}){return <article className={`ed-metric ${c}`}><div><span>{t}</span><i>{i}</i></div><strong>{v}</strong></article>}
function DownloadButton({title,sub,icon,load,click,c}){return <button className={`ed-dl ${c}`} onClick={click} disabled={load}><span>{load?<Loader2 className="ed-spin"/>:icon}</span><div><b>{title}</b><small>{load?"Generating...":sub}</small></div><Download size={14}/></button>}

const styles=`
.ed-page{min-height:100%;padding:16px;background:radial-gradient(circle at 8% 0%,rgba(59,130,246,.08),transparent 24rem),#f6f8fc;color:#172033;font-family:Inter,system-ui,sans-serif}.ed-shell{width:min(1180px,100%);margin:auto}.ed-header{display:flex;justify-content:space-between;gap:16px;padding:19px;border-radius:20px;color:#fff;background:linear-gradient(135deg,#1e1b4b,#4338ca 55%,#2563eb);box-shadow:0 18px 45px rgba(37,56,138,.18)}.ed-eyebrow{display:flex;gap:6px;align-items:center;color:#a5b4fc;font-size:8px;letter-spacing:.14em;font-weight:900}.ed-eyebrow.dark{color:#4f46e5}.ed-header h1{margin:6px 0 0;font-size:27px}.ed-header p{margin:7px 0 0;color:#dbeafe;font-size:9px}.ed-refresh{height:36px;padding:0 12px;display:flex;gap:6px;align-items:center;border:1px solid #ffffff33;border-radius:10px;color:#fff;background:#ffffff18;font-size:9px;font-weight:900}.ed-month{margin-top:10px;padding:13px 15px;display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e2e8f0;border-radius:15px;background:#fff;box-shadow:0 8px 25px #0f172a0d}.ed-month span{display:block;color:#94a3b8;font-size:7px;letter-spacing:.12em;font-weight:900}.ed-month strong{display:block;margin-top:4px;font-size:16px}.ed-month-control{display:flex;gap:6px;align-items:center}.ed-month-control>button{width:33px;height:33px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;font-size:20px;color:#334155}.ed-month-control label{min-width:175px;height:33px;padding:0 9px;display:flex;align-items:center;gap:6px;border:1px solid #e2e8f0;border-radius:9px}.ed-month-control input{width:100%;border:0;outline:0;font-size:10px;font-weight:800}.ed-error{margin-top:10px;padding:11px 12px;display:flex;gap:8px;align-items:flex-start;border:1px solid #fecdd3;border-radius:12px;background:#fff1f2;color:#9f1239}.ed-error>div{flex:1}.ed-error span{display:block;margin-top:3px;font-size:9px}.ed-error button{width:27px;height:27px;border:0;border-radius:7px;background:#ffe4e6;color:#be123c}.ed-loading{min-height:330px;margin-top:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;border:1px solid #e2e8f0;border-radius:16px;background:#fff}.ed-loading span{color:#94a3b8;font-size:9px}.ed-spin{animation:edSpin .8s linear infinite}@keyframes edSpin{to{transform:rotate(360deg)}}.ed-metrics{margin-top:10px;display:grid;grid-template-columns:repeat(6,1fr);gap:8px}.ed-metric{padding:12px;border:1px solid #e2e8f0;border-radius:14px;background:#fff;box-shadow:0 8px 22px #0f172a0d}.ed-metric>div{display:flex;justify-content:space-between;gap:6px}.ed-metric span{color:#64748b;font-size:7px;text-transform:uppercase;font-weight:900}.ed-metric i{width:28px;height:28px;display:grid;place-items:center;border-radius:8px;font-style:normal}.ed-metric strong{display:block;margin-top:7px;font-size:15px}.ed-metric.green i,.ed-dl.excel>span{background:#d1fae5;color:#047857}.ed-metric.blue i{background:#dbeafe;color:#2563eb}.ed-metric.orange i{background:#ffedd5;color:#c2410c}.ed-metric.purple i{background:#ede9fe;color:#7c3aed}.ed-metric.red i,.ed-dl.pdf>span{background:#fee2e2;color:#dc2626}.ed-metric.profit i{background:#d1fae5;color:#047857}.ed-metric.loss i{background:#fee2e2;color:#dc2626}.ed-metric.break i{background:#fef3c7;color:#b45309}.ed-result{margin-top:10px;padding:15px 17px;display:flex;justify-content:space-between;align-items:center;border-radius:15px;color:#fff;box-shadow:0 12px 30px #0f172a22}.ed-result.profit{background:linear-gradient(135deg,#065f46,#059669)}.ed-result.loss{background:linear-gradient(135deg,#991b1b,#dc2626)}.ed-result.break{background:linear-gradient(135deg,#92400e,#d97706)}.ed-result span{display:block;color:#ffffffaa;font-size:7px;letter-spacing:.13em;font-weight:900}.ed-result strong{display:block;margin-top:4px;font-size:16px}.ed-result small{display:block;margin-top:4px;color:#ffffffb8;font-size:8px}.ed-result>b{font-size:24px}.ed-card,.ed-download{margin-top:10px;padding:14px;border:1px solid #e2e8f0;border-radius:15px;background:#fff;box-shadow:0 8px 25px #0f172a0d}.ed-card-head{display:flex;justify-content:space-between;align-items:center;color:#2563eb}.ed-card-head h2,.ed-download h2{margin:0;font-size:13px;color:#172033}.ed-card-head p,.ed-download p{margin:3px 0 0;color:#94a3b8;font-size:8px}.ed-table-wrap{margin-top:10px;overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:9px 8px;border-bottom:1px solid #edf2f7;text-align:left;font-size:9px}th{background:#f8fafc;color:#64748b;text-transform:uppercase;font-size:7px}td:nth-child(2),th:nth-child(2){text-align:center}td:last-child,th:last-child{text-align:right}tfoot th{background:#fff;color:#172033}.ed-empty{padding:25px;text-align:center;color:#94a3b8;font-size:9px;border:1px dashed #cbd5e1;border-radius:10px}.ed-download{display:grid;grid-template-columns:1fr 1.6fr;align-items:center;gap:14px}.ed-download h2{margin-top:5px;font-size:15px}.ed-buttons{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.ed-dl{min-height:70px;padding:9px;display:grid;grid-template-columns:32px 1fr auto;align-items:center;gap:7px;text-align:left;border:1px solid #e2e8f0;border-radius:12px;background:#f8fafc}.ed-dl>span{width:30px;height:30px;display:grid;place-items:center;border-radius:8px}.ed-dl.text>span{background:#dbeafe;color:#2563eb}.ed-dl b{display:block;font-size:10px;color:#172033}.ed-dl small{display:block;margin-top:2px;color:#94a3b8;font-size:7px}.ed-toast{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:5000;display:flex;gap:7px;align-items:center;justify-content:center;max-width:min(380px,calc(100vw - 24px));padding:11px 14px;border:1px solid #bbf7d0;border-radius:11px;background:#f0fdf4;color:#047857;font-size:10px;font-weight:850;box-shadow:0 18px 55px rgba(15,23,42,.18);text-align:center}
@media(max-width:1100px){.ed-metrics{grid-template-columns:repeat(3,1fr)}.ed-download{grid-template-columns:1fr}}@media(max-width:700px){.ed-page{padding:9px}.ed-header{padding:13px;border-radius:15px}.ed-header h1{font-size:21px}.ed-refresh span{display:none}.ed-month{flex-direction:column;align-items:stretch}.ed-month-control label{flex:1;min-width:0}.ed-metrics{grid-template-columns:repeat(2,1fr);gap:6px}.ed-result{flex-direction:column;align-items:flex-start}.ed-buttons{grid-template-columns:1fr}}@media(max-width:420px){.ed-metrics{grid-template-columns:1fr}}

@media(max-width:700px){
  .ed-eyebrow{font-size:9px}
  .ed-header h1{font-size:22px}
  .ed-header p{font-size:10px}
  .ed-month span{font-size:8px}
  .ed-month strong{font-size:16px}
  .ed-month-control input{font-size:11px}
  .ed-metric span{font-size:8px}
  .ed-metric strong{font-size:16px}
  .ed-result span{font-size:8px}
  .ed-result strong{font-size:18px}
  .ed-result small{font-size:9px}
  .ed-result>b{font-size:26px}
  th,td{font-size:10px}
  th{font-size:8px}
  .ed-card-head h2,.ed-download h2{font-size:14px}
  .ed-card-head p,.ed-download p{font-size:9px}
  .ed-dl b{font-size:11px}
  .ed-dl small{font-size:8px}
  .ed-toast{font-size:11px}
}

/* ===== PROFESSIONAL RESPONSIVE UPGRADE ===== */
.ed-page{overflow-x:hidden}
.ed-header h1,.ed-header p,.ed-month span,.ed-month strong,.ed-card-head h2,.ed-card-head p,.ed-download h2,.ed-download p,.ed-metric span,.ed-metric strong,.ed-result span,.ed-result strong,.ed-result small,.ed-result>b,.ed-dl b,.ed-dl small,th,td{font-weight:800}
.ed-metric{min-width:0;min-height:105px;padding:15px;border:1.5px solid #cbd5e1;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.07)}
.ed-metric span{font-size:9px;color:#334155;line-height:1.35}
.ed-metric strong{margin-top:9px;font-size:19px;line-height:1.2;color:#000;font-weight:950;overflow-wrap:anywhere;word-break:break-word}
.ed-result{min-height:88px;border-width:1.5px}
.ed-result strong{font-size:20px;font-weight:950}
.ed-result small{font-size:10px}
.ed-result>b{font-size:30px;font-weight:950}
.ed-card,.ed-download{border:1.5px solid #cbd5e1;padding:16px}
.ed-card-head h2,.ed-download h2{font-size:16px;font-weight:950}
.ed-card-head p,.ed-download p{font-size:10px;color:#475569;font-weight:750}
.ed-table-wrap{margin-top:12px;border:1.5px solid #111827;border-radius:12px;overflow:auto}
.ed-table-wrap table{min-width:520px}
.ed-table-wrap th{padding:11px 10px;font-size:9px;color:#111827;background:#f1f5f9;border-bottom:1.5px solid #111827}
.ed-table-wrap td{padding:12px 10px;font-size:12px;font-weight:850;color:#000;border-bottom:1px solid #dbe3ec}
.ed-table-wrap tfoot th{padding:12px 10px;font-size:11px;color:#000;border-top:1.5px solid #111827}
.ed-buttons{gap:9px}
.ed-dl{min-height:78px;padding:11px;border:1.5px solid #cbd5e1;border-radius:12px}
.ed-dl b{font-size:12px;color:#000;font-weight:950}
.ed-dl small{font-size:9px;color:#475569;font-weight:750}
@media(max-width:700px){
 .ed-page{padding:9px}.ed-header{padding:15px;border-radius:16px}.ed-header h1{font-size:23px}.ed-header p{font-size:10px;line-height:1.45}
 .ed-month{padding:13px;border-radius:14px}.ed-month strong{font-size:17px}
 .ed-metrics{gap:8px}.ed-metric{min-height:100px;padding:13px;border-color:#111827;border-radius:13px}
 .ed-metric span{font-size:9px;font-weight:900}.ed-metric strong{font-size:18px;font-weight:950}
 .ed-result{padding:16px;min-height:94px;border-radius:14px}.ed-result span{font-size:9px}.ed-result strong{font-size:19px}.ed-result small{font-size:9px}.ed-result>b{font-size:28px}
 .ed-card{padding:12px;border-radius:14px}.ed-card-head h2{font-size:15px}.ed-card-head p{font-size:9px}
 .ed-table-wrap{border-color:#111827;margin-top:10px}.ed-table-wrap th{font-size:8px;padding:10px}.ed-table-wrap td{font-size:11px;padding:11px 10px}
 .ed-download{padding:13px;border-radius:14px}.ed-download h2{font-size:15px}.ed-download p{font-size:9px}.ed-buttons{gap:8px}
 .ed-dl{min-height:72px;border-color:#111827}.ed-dl b{font-size:12px}.ed-dl small{font-size:9px}
}
@media(max-width:430px){
 .ed-metrics{grid-template-columns:1fr}.ed-metric{min-height:92px;padding:13px}.ed-metric strong{font-size:20px}
 .ed-result strong{font-size:20px}.ed-result>b{font-size:29px}.ed-table-wrap table{min-width:480px}.ed-table-wrap td{font-size:11px}
}
@media(min-width:701px){.ed-table-wrap table{min-width:100%}}
`;