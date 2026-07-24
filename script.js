(function(){
  const state = {
    sections: ['Home','About','Services','Contact'],
    keywords: ['best bakery in lahore','custom cake delivery lahore','birthday cakes near me'],
    template: 'minimal',
    discountMode: null, // 'percent' | 'amount' | null
    quoteRef: 'QT-' + Math.floor(1000 + Math.random()*9000)
  };

  const $ = (id) => document.getElementById(id);

  // ---------- Defaults ----------
  const today = new Date();
  const inTwoWeeks = new Date(today.getTime() + 14*24*3600*1000);
  $('quoteDate').value = today.toISOString().slice(0,10);
  $('deliveryDate').value = inTwoWeeks.toISOString().slice(0,10);

  function fmtDate(str){
    if(!str) return '—';
    const d = new Date(str+'T00:00:00');
    return d.toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'});
  }
  function fmtMoney(n){
    n = Math.round(Number(n)||0);
    return 'Rs. ' + n.toLocaleString('en-IN');
  }

  // ---------- Sections ----------
  $('sectionChips').addEventListener('click', function(e){
    const chip = e.target.closest('.section-chip');
    if(!chip) return;
    const cb = chip.querySelector('input');
    setTimeout(()=>{
      chip.classList.toggle('active', cb.checked);
      syncSections();
    },0);
  });
  $('addSectionBtn').addEventListener('click', function(){
    const val = $('customSectionInput').value.trim();
    if(!val) return;
    const label = document.createElement('label');
    label.className = 'section-chip active';
    label.innerHTML = '<input type="checkbox" checked value="'+val.replace(/"/g,'')+'"><i class="bi bi-check-circle-fill"></i> '+val;
    $('sectionChips').appendChild(label);
    $('customSectionInput').value = '';
    syncSections();
  });
  $('customSectionInput').addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); $('addSectionBtn').click(); }
  });
  function syncSections(){
    state.sections = Array.from($('sectionChips').querySelectorAll('input:checked')).map(i=>i.value);
    renderPreview();
  }

  // ---------- Package inclusions ----------
  $('pkgChips').addEventListener('click', function(e){
    const chip = e.target.closest('.section-chip');
    if(!chip) return;
    const cb = chip.querySelector('input');
    setTimeout(()=>{
      chip.classList.toggle('active', cb.checked);
      renderPreview();
    },0);
  });
  function getPackage(){
    return Array.from($('pkgChips').querySelectorAll('input:checked')).map(i=>i.value);
  }

  // ---------- Keywords ----------
  function renderKeywordTags(){
    const wrap = $('keywordTags');
    wrap.innerHTML = '';
    state.keywords.forEach((kw, idx)=>{
      const tag = document.createElement('span');
      tag.className = 'keyword-tag';
      tag.innerHTML = kw + ' <button type="button" data-idx="'+idx+'">&times;</button>';
      wrap.appendChild(tag);
    });
    wrap.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', function(){
        state.keywords.splice(Number(this.dataset.idx),1);
        renderKeywordTags();
        renderPreview();
      });
    });
  }
  function addKeyword(val){
    val = val.trim();
    if(!val) return;
    if(!state.keywords.some(k=>k.toLowerCase()===val.toLowerCase())) state.keywords.push(val);
  }
  $('addKeywordBtn').addEventListener('click', function(){
    addKeyword($('keywordInput').value);
    $('keywordInput').value = '';
    renderKeywordTags();
    renderPreview();
  });
  $('keywordInput').addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ e.preventDefault(); $('addKeywordBtn').click(); }
  });

  // bulk paste / extract
  $('bulkToggleBtn').addEventListener('click', function(){
    const wrap = $('bulkKeywordWrap');
    const showing = wrap.style.display !== 'none';
    wrap.style.display = showing ? 'none' : 'block';
    this.textContent = showing ? '+ paste keywords in bulk' : '− hide bulk paste';
  });
  $('extractKeywordsBtn').addEventListener('click', function(){
    const raw = $('bulkKeywords').value;
    if(!raw.trim()) return;
    // split on commas, semicolons, newlines, or bullet/number prefixes
    const parts = raw.split(/[\n,;]+/)
      .map(s => s.replace(/^[\s\-\*\u2022\d\.\)]+/, '').trim())
      .filter(Boolean);
    parts.forEach(addKeyword);
    $('bulkKeywords').value = '';
    renderKeywordTags();
    renderPreview();
  });

  // ---------- Discount ----------
  $('discountEnable').addEventListener('change', function(){
    $('discountFields').style.display = this.checked ? 'flex' : 'none';
    if(!this.checked){
      state.discountMode = null;
      $('discountPercent').value = '';
      $('discountAmount').value = '';
    }
    updatePricing();
  });
  $('discountPercent').addEventListener('input', function(){
    state.discountMode = 'percent';
    updatePricing();
  });
  $('discountAmount').addEventListener('input', function(){
    state.discountMode = 'amount';
    updatePricing();
  });

  function computeDiscount(total){
    if(!$('discountEnable').checked) return 0;
    let pctEl = $('discountPercent'), amtEl = $('discountAmount');
    let discount = 0;
    if(state.discountMode === 'amount' && amtEl.value !== ''){
      discount = Number(amtEl.value) || 0;
      const pct = total > 0 ? (discount/total*100) : 0;
      pctEl.value = pct ? (Math.round(pct*10)/10) : '';
    } else if(state.discountMode === 'percent' && pctEl.value !== ''){
      const pct = Number(pctEl.value) || 0;
      discount = Math.round(total*pct/100);
      amtEl.value = discount || '';
    } else if(amtEl.value !== ''){
      discount = Number(amtEl.value) || 0;
    }
    return Math.min(discount, total);
  }

  // ---------- Pricing ----------
  function updatePricing(){
    const total = Number($('totalPrice').value)||0;
    const discount = computeDiscount(total);
    const payable = Math.max(total - discount, 0);

    $('sumSubtotal').textContent = fmtMoney(total);
    if(discount > 0){
      $('sumDiscountRow').style.display = 'flex';
      const pctShown = total>0 ? Math.round((discount/total*100)*10)/10 : 0;
      $('sumDiscount').textContent = '− ' + fmtMoney(discount) + ' (' + pctShown + '%)';
    } else {
      $('sumDiscountRow').style.display = 'none';
    }
    $('sumTotal').textContent = fmtMoney(payable);

    const advPct = Number($('advancePercent').value);
    const remPct = 100 - advPct;
    const advAmt = Math.round(payable*advPct/100);
    const remAmt = payable - advAmt;
    $('advPctLabel').textContent = advPct+'% advance';
    $('remPctLabel').textContent = remPct+'% on completion';
    $('advSplitBox').style.width = advPct+'%';
    $('remSplitBox').style.width = remPct+'%';
    $('advSplitBox').textContent = advPct>12 ? fmtMoney(advAmt) : '';
    $('remSplitBox').textContent = remPct>12 ? fmtMoney(remAmt) : '';
    renderPreview();
  }
  ['totalPrice','advancePercent'].forEach(id=>$(id).addEventListener('input', updatePricing));

  // ---------- Template picker ----------
  document.querySelectorAll('.tpl-card').forEach(card=>{
    card.addEventListener('click', function(){
      document.querySelectorAll('.tpl-card').forEach(c=>c.classList.remove('active'));
      card.classList.add('active');
      state.template = card.dataset.tpl;
      renderPreview();
    });
  });

  // ---------- Generic field listeners ----------
  ['bizName','bizContact','clientName','quoteDate','serviceType','deliveryDate','domainName'].forEach(id=>{
    $(id).addEventListener('input', renderPreview);
    $(id).addEventListener('change', renderPreview);
  });

  // ---------- Barcode ----------
  function barcodeHTML(text){
    let bars = '';
    const len = text.length * 4;
    for(let i=0;i<len;i++){
      const c = text.charCodeAt(i % text.length);
      const w = 2 + ((c * (i+3)) % 5);
      bars += '<span style="width:'+w+'px;"></span>';
    }
    return '<div class="barcode-bars">'+bars+'</div><div class="barcode-text">'+text+'</div>';
  }

  // ---------- Data ----------
  function getData(){
    const total = Number($('totalPrice').value)||0;
    const discount = computeDiscount(total);
    const payable = Math.max(total - discount, 0);
    const advPct = Number($('advancePercent').value);
    const advAmt = Math.round(payable*advPct/100);
    const remAmt = payable - advAmt;
    return {
      bizName: $('bizName').value || 'Your Business',
      bizContact: $('bizContact').value || '',
      client: $('clientName').value || 'Client Name',
      date: fmtDate($('quoteDate').value),
      service: $('serviceType').value,
      delivery: fmtDate($('deliveryDate').value),
      domain: $('domainName').value || '—',
      sections: state.sections,
      keywords: state.keywords,
      pkg: getPackage(),
      total, discount, payable,
      discountPct: total>0 ? Math.round((discount/total*100)*10)/10 : 0,
      advPct, remPct: 100-advPct, advAmt, remAmt,
      ref: state.quoteRef
    };
  }

  function rankList(keywords){
    if(!keywords.length) return '<div style="font-size:.76rem;color:var(--slate);">No keywords added yet</div>';
    return '<ul class="rank-list">'+keywords.map((k,i)=>
      '<li><span class="rank-badge">'+(i+1)+'</span> '+k+'</li>'
    ).join('')+'</ul>';
  }

  function includedGrid(pkg){
    if(!pkg.length) return '<div style="font-size:.76rem;color:var(--slate);">No package items selected</div>';
    return '<div class="included-grid">'+pkg.map(p=>
      '<div class="item"><i class="bi bi-check-circle-fill"></i> '+p+'</div>'
    ).join('')+'</div>';
  }

  function priceSummary(d){
    let html = '<div class="price-summary">';
    html += '<div class="r"><span>Subtotal</span><span>'+fmtMoney(d.total)+'</span></div>';
    if(d.discount > 0){
      html += '<div class="r"><span>Discount ('+d.discountPct+'%)</span><span>− '+fmtMoney(d.discount)+'</span></div>';
    }
    html += '</div>';
    return html;
  }

  // ---------- Render preview ----------
  function renderPreview(){
    const d = getData();
    const doc = $('quoteDoc');
    let html = '';

    if(state.template === 'minimal'){
      html = `
      <div class="doc-minimal">
        <div class="doc-head">
          <div>
            <div class="doc-title">Project Quote</div>
            <div class="biz-name">${d.bizName} · for ${d.client}</div>
          </div>
          <div class="doc-meta">REF: ${d.ref}<br>DATE: ${d.date}<br>DELIVERY: ${d.delivery}</div>
        </div>
        <div class="row-line"><span>Service Type</span><strong>${d.service}</strong></div>
        <div class="row-line"><span>Sections Included</span><strong>${d.sections.join(', ')||'—'}</strong></div>
        <div class="row-line"><span>Domain to Purchase</span><strong>${d.domain}</strong></div>
        <div class="section-title" style="font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin:.9rem 0 .3rem;color:var(--slate);">What's Included</div>
        ${includedGrid(d.pkg)}
        <div class="section-title" style="font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin:.9rem 0 .3rem;color:var(--slate);">Target Ranking Keywords</div>
        ${rankList(d.keywords)}
        <div class="price-box">
          ${priceSummary(d)}
          <div style="font-size:.7rem;color:#9d9da5;font-family:'JetBrains Mono',monospace;text-transform:uppercase;margin-top:.5rem;">Total Payable</div>
          <div class="total">${fmtMoney(d.payable)}</div>
          <div class="split-line"><span>Advance (${d.advPct}%) — ${fmtMoney(d.advAmt)}</span><span>On Completion (${d.remPct}%) — ${fmtMoney(d.remAmt)}</span></div>
        </div>
      </div>`;
    }

    if(state.template === 'bold'){
      html = `
      <div class="doc-bold">
        <div class="eyebrow">${d.bizName} · Project Quote · ${d.ref}</div>
        <div class="doc-title">${d.client}</div>
        <div class="meta-grid">
          <div><div class="k">Service</div><div class="v">${d.service}</div></div>
          <div><div class="k">Domain</div><div class="v">${d.domain}</div></div>
          <div><div class="k">Date Issued</div><div class="v">${d.date}</div></div>
          <div><div class="k">Delivery</div><div class="v">${d.delivery}</div></div>
        </div>
        <div class="eyebrow" style="margin-top:.4rem;">Sections Included</div>
        <div style="font-size:.82rem;margin-top:.2rem;">${d.sections.join(' · ')||'—'}</div>
        <div class="eyebrow" style="margin-top:.8rem;">What's Included</div>
        ${includedGrid(d.pkg)}
        <div class="eyebrow" style="margin-top:.8rem;">Ranking Targets</div>
        ${rankList(d.keywords)}
        <div class="price-hero">
          ${priceSummary(d)}
          <div class="eyebrow" style="margin-top:.5rem;">Total Payable</div>
          <div class="total">${fmtMoney(d.payable)}</div>
          <div class="split-line"><span>Advance (${d.advPct}%) — ${fmtMoney(d.advAmt)}</span><span>Completion (${d.remPct}%) — ${fmtMoney(d.remAmt)}</span></div>
        </div>
      </div>`;
    }

    if(state.template === 'corporate'){
      html = `
      <div class="doc-corporate">
        <div class="band">
          <div>
            <div class="doc-title">Project Quote</div>
            <div style="font-size:.75rem;color:#DCDBFB;">${d.bizName}</div>
          </div>
          <div class="meta">REF ${d.ref}<br>${d.date}<br>Delivery: ${d.delivery}</div>
        </div>
        <div class="body-pad">
          <table>
            <tr><td>Client</td><td>${d.client}</td></tr>
            <tr><td>Service Type</td><td>${d.service}</td></tr>
            <tr><td>Sections</td><td>${d.sections.join(', ')||'—'}</td></tr>
            <tr><td>Domain</td><td>${d.domain}</td></tr>
          </table>
          <div class="section-title" style="font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin:.9rem 0 .3rem;color:var(--slate);">What's Included</div>
          ${includedGrid(d.pkg)}
          <div class="section-title" style="font-size:.68rem;text-transform:uppercase;letter-spacing:.06em;font-weight:700;margin:.9rem 0 .3rem;color:var(--slate);">Target Ranking Keywords</div>
          ${rankList(d.keywords)}
          <div class="price-box">
            ${priceSummary(d)}
            <div style="font-size:.68rem;color:var(--slate);font-family:'JetBrains Mono',monospace;text-transform:uppercase;margin-top:.5rem;">Total Payable</div>
            <div class="total">${fmtMoney(d.payable)}</div>
            <div class="split-line"><span>Advance (${d.advPct}%) — ${fmtMoney(d.advAmt)}</span><span>Completion (${d.remPct}%) — ${fmtMoney(d.remAmt)}</span></div>
          </div>
        </div>
      </div>`;
    }

    if(state.template === 'receipt'){
      html = `
      <div class="doc-receipt"><div class="card">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <div class="eyebrow">Sales Quote</div>
            <div class="doc-title">${d.bizName}</div>
            <div class="biz-sub">${d.bizContact}</div>
          </div>
          <div class="ref-box">${d.ref}</div>
        </div>
        <div class="row-line"><span>Date</span><strong>${d.date}</strong></div>
        <div class="row-line"><span>Client</span><strong>${d.client}</strong></div>
        <div class="row-line"><span>Service</span><strong>${d.service}</strong></div>
        <div class="row-line"><span>Status</span><span class="badge-status">PENDING APPROVAL</span></div>
        <div class="section-title">What's Included</div>
        ${includedGrid(d.pkg)}
        <div class="section-title">Target Ranking Keywords</div>
        ${rankList(d.keywords)}
        <div class="price-summary">
          ${priceSummary(d)}
        </div>
        <div class="total mt-1">${fmtMoney(d.payable)}</div>
        <div class="split-line"><span>Advance (${d.advPct}%) — ${fmtMoney(d.advAmt)}</span><span>On Completion — ${fmtMoney(d.remAmt)}</span></div>
        <div class="note-box"><i class="bi bi-info-circle me-1"></i>Advance payment confirms project start. Domain "${d.domain}" to be purchased before delivery.</div>
        ${barcodeHTML(d.ref)}
      </div></div>`;
    }

    if(state.template === 'tealband'){
      html = `
      <div class="doc-tealband">
        <div class="band d-flex justify-content-between align-items-start">
          <div>
            <div class="doc-title">${d.bizName}</div>
            <div class="eyebrow">Project Quote</div>
          </div>
          <div class="meta">${d.date}<br>Delivery: ${d.delivery}</div>
        </div>
        <div class="body-pad">
          <div class="row-line"><span>Billed To</span><strong>${d.client}</strong></div>
          <div class="row-line"><span>Quote #</span><strong>${d.ref}</strong></div>
          <div class="row-line"><span>Service</span><strong>${d.service}</strong></div>
          <div class="row-line"><span>Status</span><span class="badge-status">AWAITING APPROVAL</span></div>
          <div class="section-title">What's Included</div>
          ${includedGrid(d.pkg)}
          <div class="section-title">Target Ranking Keywords</div>
          ${rankList(d.keywords)}
          <div class="amount-box">
            <div class="lbl2">Total Payable</div>
            <div class="total">${fmtMoney(d.payable)}</div>
            ${d.discount>0 ? '<div class="lbl2" style="color:var(--green);">Discount applied: '+fmtMoney(d.discount)+' ('+d.discountPct+'%)</div>' : ''}
            <div class="split-line"><span>Advance (${d.advPct}%) — ${fmtMoney(d.advAmt)}</span><span>Completion (${d.remPct}%) — ${fmtMoney(d.remAmt)}</span></div>
          </div>
          <div class="footer-note">Domain "${d.domain}" · ${d.bizContact}</div>
        </div>
      </div>`;
    }

    if(state.template === 'typewriter'){
      html = `
      <div class="doc-typewriter">
        <div class="perf"></div>
        <div class="inner">
          <div class="biz-name">${d.bizName.toUpperCase()}</div>
          <div class="biz-sub">${d.bizContact}</div>
          <hr>
          <div class="row-line"><span>Quote</span><span>#${d.ref}</span></div>
          <div class="row-line"><span>Date</span><span>${d.date}</span></div>
          <div class="row-line"><span>Client</span><span>${d.client}</span></div>
          <div class="row-line"><span>Service</span><span>${d.service}</span></div>
          <div class="ref-box">${d.ref}</div>
          <div class="section-title">What's Included</div>
          ${includedGrid(d.pkg)}
          <div class="section-title">Ranking Keywords</div>
          ${rankList(d.keywords)}
          <hr>
          <div class="price-summary">
            <div class="r"><span>SUBTOTAL</span><span>${fmtMoney(d.total)}</span></div>
            ${d.discount>0 ? '<div class="r"><span>DISCOUNT ('+d.discountPct+'%)</span><span>-'+fmtMoney(d.discount)+'</span></div>' : ''}
            <div class="r total"><span>TOTAL</span><span>${fmtMoney(d.payable)}</span></div>
          </div>
          <div class="split-line"><span>ADVANCE ${d.advPct}% — ${fmtMoney(d.advAmt)}</span><span>DUE — ${fmtMoney(d.remAmt)}</span></div>
          <div class="thankyou">THANK YOU FOR YOUR BUSINESS!</div>
          <div class="footer-note">Domain: ${d.domain} · Delivery: ${d.delivery}</div>
          ${barcodeHTML(d.ref)}
        </div>
        <div class="perf"></div>
      </div>`;
    }

    doc.innerHTML = html;
  }

  // ---------- PDF generation ----------
  async function generatePdfBlob(){
    const target = $('quoteDoc').firstElementChild;
    const canvas = await html2canvas(target, {scale:2, useCORS:true});
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p','mm','a4');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgW = pageW;
    const imgH = (canvas.height * imgW) / canvas.width;
    pdf.addImage(imgData,'PNG',0,0,imgW, imgH > pageH ? pageH : imgH);
    return pdf;
  }

  $('downloadPdfBtn').addEventListener('click', async function(){
    const status = $('pdfStatus');
    status.textContent = 'Generating PDF...';
    try{
      const pdf = await generatePdfBlob();
      const d = getData();
      pdf.save('Quote-'+d.client.replace(/\s+/g,'_')+'.pdf');
      status.textContent = 'PDF downloaded ✓';
    }catch(err){
      status.textContent = 'Could not generate PDF. Try again.';
      console.error(err);
    }
    setTimeout(()=>status.textContent='', 3000);
  });

  $('sharePdfBtn').addEventListener('click', async function(){
    const status = $('pdfStatus');
    status.textContent = 'Preparing PDF to share...';
    try{
      const pdf = await generatePdfBlob();
      const d = getData();
      const filename = 'Quote-'+d.client.replace(/\s+/g,'_')+'.pdf';
      const blob = pdf.output('blob');
      const file = new File([blob], filename, {type:'application/pdf'});

      if(navigator.canShare && navigator.canShare({files:[file]})){
        await navigator.share({
          files:[file],
          title:'Project Quote — '+d.client
        });
        status.textContent = 'Share sheet opened ✓';
      } else {
        pdf.save(filename);
        status.textContent = 'Sharing not supported here — PDF downloaded instead so you can attach it manually.';
      }
    }catch(err){
      if(err && err.name === 'AbortError'){
        status.textContent = '';
      } else {
        status.textContent = 'Could not share PDF. Try downloading instead.';
        console.error(err);
      }
    }
    setTimeout(()=>{ if(status.textContent.length < 60) status.textContent=''; }, 4000);
  });

  // ---------- Init ----------
  renderKeywordTags();
  updatePricing();
  renderPreview();
})();
