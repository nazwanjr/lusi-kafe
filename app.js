'use strict';
const $=s=>document.querySelector(s),rp=n=>'Rp '+Math.round(n).toLocaleString('id-ID');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const LS={g:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},s:(k,v)=>localStorage.setItem(k,JSON.stringify(v))};
const U=id=>`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=80`;
const CATS=['Signature Coffee','Non-Coffee','Artisanal Pastry','Main Course'],DRINK=['Signature Coffee','Non-Coffee'];
const SEED=[
 [1,'Aurum Gold Latte',0,42000,40,'1461023058943-07fcbe16d735'],[2,'Velvet Espresso Tonic',0,38000,35,'1517701604599-bb29b565090c'],
 [3,'Caramel Macchiato',0,45000,30,'1485808191679-5f86510681a2'],[4,'Gula Aren Reserve',0,36000,25,'1541167760496-1628856ab772'],
 [5,'Ceremonial Uji Matcha',1,40000,25,'1515823064-d6e0c04616a7'],[6,'Belgian Dark Chocolate',1,39000,28,'1542990253-0d0f5be5f0ed'],
 [7,'French Butter Croissant',2,32000,20,'1555507036-ab1f4038808a'],[8,'Pain au Chocolat',2,35000,3,'1509365465985-25d11c17e812'],
 [9,'Truffle Mushroom Pasta',3,89000,15,'1621996346565-e3dbc646d9a9']].map(a=>({id:a[0],name:a[1],cat:CATS[a[2]],price:a[3],stock:a[4],img:U(a[5])}));
let menu,orders,members,shift,seq,cart=[],role='customer',cat='Semua',q='',cur=null,qty=1,promo=null,chart=null;
function load(){menu=LS.g('lk_menu',null);if(!menu){menu=SEED;LS.s('lk_menu',menu)}orders=LS.g('lk_orders',[]);members=LS.g('lk_members',{});shift=LS.g('lk_shift',null);seq=LS.g('lk_seq',0)}
function save(){LS.s('lk_menu',menu);LS.s('lk_orders',orders);LS.s('lk_members',members);LS.s('lk_shift',shift);LS.s('lk_seq',seq)}
load();
const M=id=>new bootstrap.Modal('#'+id),show=id=>bootstrap.Modal.getOrCreateInstance('#'+id).show(),hide=id=>bootstrap.Modal.getOrCreateInstance('#'+id).hide();
const toast=(t,i='success')=>Swal.fire({toast:true,position:'top-end',icon:i,title:t,showConfirmButton:false,timer:1800});
const staff=()=>role==='staff';

/* ---------- Menu ---------- */
function renderMenu(){
 $('#cats').innerHTML=['Semua',...CATS].map(c=>`<button class="btn btn-sm chip ${c==cat?'on':''}" data-c="${c}">${c}</button>`).join('');
 $('#grid').innerHTML=menu.filter(m=>(cat=='Semua'||m.cat==cat)&&m.name.toLowerCase().includes(q)).map(m=>`
 <div class="col-6 col-md-4"><div class="card item ${m.stock<1?'out':''}" data-id="${m.id}"><img src="${esc(m.img)}" alt="${esc(m.name)}" loading="lazy" onerror="this.style.visibility='hidden'">
 <div class="card-body"><h3 class="serif">${esc(m.name)}</h3><small class="text-muted">${m.cat}</small>
 <div class="d-flex justify-content-between align-items-center mt-2"><b class="gold">${rp(m.price)}</b>
 ${m.stock<1?'<span class="badge bg-secondary">Habis</span>':m.stock<5?`<span class="badge low">Sisa ${m.stock}</span>`:`<small class="text-muted">Stok ${m.stock}</small>`}</div></div></div></div>`).join('')||'<p class="text-muted">Menu tidak ditemukan.</p>';
}
function openItem(id){
 cur=menu.find(m=>m.id==id);qty=1;$('#imQty').textContent=1;$('#imName').textContent=cur.name;$('#imPrice').textContent=rp(cur.price);
 $('#imImg').src=cur.img;$('#imNote').value='';$('#imOpts').classList.toggle('d-none',!DRINK.includes(cur.cat));
 $('#t1').checked=$('#s1').checked=true;show('itemModal');
}
function addToCart(){
 const drink=DRINK.includes(cur.cat),temp=drink?document.querySelector('[name=temp]:checked').value:'',sugar=drink?document.querySelector('[name=sugar]:checked').value:'',note=$('#imNote').value.trim();
 const have=cart.filter(c=>c.id==cur.id).reduce((a,c)=>a+c.qty,0);
 if(have+qty>cur.stock)return toast('Stok tidak mencukupi','error');
 const key=[cur.id,temp,sugar,note].join('|'),ex=cart.find(c=>c.key==key);
 ex?ex.qty+=qty:cart.push({key,id:cur.id,name:cur.name,price:cur.price,qty,temp,sugar,note,sel:false});
 hide('itemModal');renderCart();toast(cur.name+' ditambahkan');
}

/* ---------- Cart & billing ---------- */
const payItems=()=>{const s=cart.filter(c=>c.sel);return staff()&&s.length?s:cart};
function calc(items){
 const sub=items.reduce((a,c)=>a+c.price*c.qty,0),d=promo?Math.round(sub*promo.pct):0,pts=members[$('#phone').value.trim()]?.pts||0;
 const red=$('#usePts').checked&&pts?Math.min(pts*1000,sub-d):0,base=sub-d-red,tax=Math.round(base*.1);
 return{sub,d,red,redPts:Math.ceil(red/1000),tax,total:base+tax};
}
const row=(a,b)=>`<div class="d-flex justify-content-between"><span class="text-muted">${a}</span><span>${b<0?'− '+rp(-b):rp(b)}</span></div>`;
function renderCart(){
 $('#cartList').innerHTML=cart.length?cart.map((c,i)=>`<div class="ci d-flex gap-2 align-items-start">${staff()?`<input type="checkbox" class="form-check-input mt-2" data-a="sel" data-i="${i}" ${c.sel?'checked':''} aria-label="Pilih untuk split bill">`:''}
 <div class="flex-grow-1"><div class="fw-semibold">${esc(c.name)}</div><small class="text-muted">${c.temp?c.temp+' · '+c.sugar:'Tanpa varian'}${c.note?' · “'+esc(c.note)+'”':''}</small><div class="gold small">${rp(c.price)}</div></div>
 <div class="qty"><button data-a="dec" data-i="${i}">−</button><b>${c.qty}</b><button data-a="inc" data-i="${i}">+</button></div>
 <button class="btn btn-sm text-danger" data-a="del" data-i="${i}" aria-label="Hapus"><i class="bi bi-trash"></i></button></div>`).join(''):'<p class="text-muted text-center py-4">Keranjang kosong. Pilih menu untuk mulai memesan.</p>';
 const items=payItems(),t=calc(items),split=staff()&&cart.some(c=>c.sel);
 $('#totals').innerHTML=row('Subtotal',t.sub)+(t.d?row('Diskon promo',-t.d):'')+(t.red?row('Tukar poin',-t.red):'')+row('PPN 10%',t.tax)+`<div class="d-flex justify-content-between fs-5 fw-bold gold mt-2"><span>Total</span><span>${rp(t.total)}</span></div>`;
 $('#btnPay').innerHTML=staff()?(split?'<i class="bi bi-scissors"></i> Bayar item terpilih':'<i class="bi bi-wallet2"></i> Bayar sekarang'):'<i class="bi bi-send"></i> Kirim pesanan ke dapur';
 $('#btnPay').disabled=!cart.length;
}
function renderMember(){const p=$('#phone').value.trim(),m=members[p];$('#memInfo').textContent=p?(m?`Member ${p}: ${m.pts} poin (≈ ${rp(m.pts*1000)})`:'Member baru — poin akan dibuat saat bayar.'):'Member: 1 poin tiap Rp 10.000, 1 poin = potongan Rp 1.000.'}
function tableOpts(){$('#table').innerHTML=Array.from({length:20},(_,i)=>`<option value="${i+1}">Meja ${i+1}</option>`).join('');$('#table').insertAdjacentHTML('afterbegin','<option value="">Pilih nomor meja…</option>');$('#table').value=''}
const otype=()=>staff()?document.querySelector('[name=otype]:checked').value:'Dine-In';

function createOrder(items,t,o){
 items.forEach(c=>{menu.find(m=>m.id==c.id).stock-=c.qty});
 const d=new Date(),inv=`LK-${d.toISOString().slice(0,10).replace(/-/g,'')}-${String(++seq).padStart(3,'0')}`;
 const ord={inv,time:d.toISOString(),type:otype(),table:otype()=='Dine-In'?$('#table').value:'',items:items.map(({name,price,qty,temp,sugar,note})=>({name,price,qty,temp,sugar,note})),...t,promo:promo?.code||'',phone:o.phone||'',status:'Menunggu',paid:!!o.paid,method:o.method||'',cash:o.cash||0,change:o.change||0,earned:0,shift:shift?.id||null,from:role};
 if(o.paid&&o.phone){const m=members[o.phone]||(members[o.phone]={pts:0});m.pts=m.pts-t.redPts+(ord.earned=Math.floor(t.total/10000))}
 orders.push(ord);cart=cart.filter(c=>!items.includes(c));if(!cart.length){promo=null;$('#promo').value=''}
 $('#usePts').checked=false;save();renderMenu();renderCart();renderMember();updateK();return ord;
}
function checkout(){
 if(!cart.length)return;
 if(otype()=='Dine-In'&&!$('#table').value)return Swal.fire('Nomor meja belum dipilih','Pilih nomor meja terlebih dahulu.','warning');
 if(!staff()){const t=calc(cart),o=createOrder([...cart],t,{});return Swal.fire({icon:'success',title:'Pesanan terkirim!',html:`Invoice <b>${o.inv}</b><br>Meja ${o.table}. Silakan bayar di kasir saat pesanan siap.`,confirmButtonColor:'#d4af37'})}
 if(!shift)return Swal.fire('Shift belum dibuka','Buka shift kasir lebih dulu.','info');
 const t=calc(payItems());$('#payTotal').textContent=rp(t.total);$('#m1').checked=true;$('#cashIn').value='';$('#cashBox').classList.remove('d-none');
 $('#quick').innerHTML=[['Uang pas',t.total],['50.000',50000],['100.000',100000],['200.000',200000]].map(([l,v])=>`<button class="btn btn-sm btn-outline-gold" data-v="${v}">${l}</button>`).join('');
 $('#chg').textContent='';show('payModal');
}
function qrisPopup(total){
 return Swal.fire({title:'Scan QRIS',html:`<canvas id="qr" width="230" height="230"></canvas><p class="mt-2">${rp(total)}<br><small>Simulasi QR — LUCEE KAFE</small></p>`,confirmButtonText:'Pembayaran diterima',showCancelButton:true,cancelButtonText:'Batal',confirmButtonColor:'#d4af37',
 didOpen:()=>{const c=$('#qr'),x=c.getContext('2d'),n=25,s=c.width/n;let r=total%9973+7;const rnd=()=>(r=(r*9301+49297)%233280)/233280;x.fillStyle='#fff';x.fillRect(0,0,230,230);x.fillStyle='#000';
 for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(!((i<8&&j<8)||(i<8&&j>16)||(i>16&&j<8))&&rnd()>.52)x.fillRect(i*s,j*s,s,s);
 [[0,0],[18,0],[0,18]].forEach(([a,b])=>{x.fillStyle='#000';x.fillRect(a*s,b*s,7*s,7*s);x.fillStyle='#fff';x.fillRect((a+1)*s,(b+1)*s,5*s,5*s);x.fillStyle='#000';x.fillRect((a+2)*s,(b+2)*s,3*s,3*s)})}});
}
async function confirmPay(){
 const items=payItems(),t=calc(items),method=document.querySelector('[name=method]:checked').value,cash=+$('#cashIn').value||0;
 if(method=='Tunai'&&cash<t.total)return toast('Uang diterima kurang','error');
 if(method=='QRIS'&&!(await qrisPopup(t.total)).isConfirmed)return;
 hide('payModal');
 const o=createOrder([...items],t,{paid:true,method,cash:method=='Tunai'?cash:t.total,change:method=='Tunai'?cash-t.total:0,phone:$('#phone').value.trim()});
 await Swal.fire({icon:'success',title:'Pembayaran berhasil',html:`${o.inv}<br>${o.change?'Kembalian '+rp(o.change)+'<br>':''}${o.earned?'+'+o.earned+' poin member':''}<br><small>Struk PDF diunduh otomatis.</small>`,timer:2600,showConfirmButton:false});
 receipt(o);
}

/* ---------- Receipt PDF ---------- */
function receipt(o){
 const {jsPDF}=window.jspdf,d=new jsPDF({unit:'mm',format:[80,110+o.items.length*11]});let y=10;
 const C=(t,s=9,b)=>{d.setFont('courier',b?'bold':'normal');d.setFontSize(s);d.text(t,40,y,{align:'center'});y+=s*.5+1},
 L=(a,b,bd)=>{d.setFont('courier',bd?'bold':'normal');d.setFontSize(8);d.text(a,5,y);d.text(b,75,y,{align:'right'});y+=4},ln=()=>{d.setFont('courier','normal');d.setFontSize(8);d.text('-'.repeat(38),40,y,{align:'center'});y+=4},num=n=>Math.round(n).toLocaleString('id-ID');
 C('LUCEE KAFE',15,1);C('5-Star Artisanal Roastery',8);C('Bandung, Jawa Barat',8);ln();
 L('No',o.inv);L('Tanggal',new Date(o.time).toLocaleString('id-ID'));L('Tipe',o.type+(o.table?' / Meja '+o.table:''));if(o.phone)L('Member',o.phone);ln();
 o.items.forEach(i=>{L(i.name.slice(0,22),'');y-=4;L(`${i.qty} x ${num(i.price)}`,num(i.qty*i.price));if(i.temp)L(` ${i.temp}, ${i.sugar}`,'');if(i.note)L(' Note: '+i.note.slice(0,28),'')});ln();
 L('Subtotal',num(o.sub));if(o.d)L('Diskon '+o.promo,'-'+num(o.d));if(o.red)L('Tukar poin ('+o.redPts+')','-'+num(o.red));L('PPN 10%',num(o.tax));L('TOTAL',num(o.total),1);ln();
 if(o.paid){L('Bayar ('+o.method+')',num(o.cash));if(o.method=='Tunai')L('Kembali',num(o.change));if(o.phone){L('Poin didapat','+'+o.earned);L('Saldo poin',String(members[o.phone]?.pts||0))}}else L('Status','BELUM DIBAYAR',1);
 y+=3;C('Terima kasih atas kunjungan Anda',8);C('Secangkir kemewahan, setiap hari.',8);d.save(o.inv+'.pdf');
}

/* ---------- Kitchen ---------- */
const ST=['Menunggu','Sedang Diracik','Siap Disajikan','Selesai'];
function bell(){const a=new(window.AudioContext||window.webkitAudioContext)();[880,1318.5,1760].forEach((f,i)=>{const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+i*.2;o.type='sine';o.frequency.value=f;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.35,t);g.gain.exponentialRampToValueAtTime(.001,t+1.5);o.start(t);o.stop(t+1.6)})}
const active=()=>orders.filter(o=>o.status!='Selesai');
function updateK(){$('#kCount').textContent=orders.filter(o=>o.status=='Menunggu').length}
function renderKitchen(){
 const l=active();$('#kList').innerHTML=l.length?l.map(o=>{const s=ST.indexOf(o.status);return`<div class="col-md-6 col-xl-4"><div class="card kcard s${s}"><div class="card-body">
 <div class="d-flex justify-content-between"><b>${o.inv.slice(-3)} · ${o.type}${o.table?' · Meja '+o.table:''}</b><span class="badge ${o.paid?'bg-success':'bg-warning text-dark'}">${o.paid?'Lunas':'Belum bayar'}</span></div>
 <ul class="small my-2 ps-3">${o.items.map(i=>`<li>${i.qty}× ${esc(i.name)}${i.temp?` <span class="text-muted">(${i.temp}, ${i.sugar})</span>`:''}${i.note?` <em>“${esc(i.note)}”</em>`:''}</li>`).join('')}</ul>
 <div class="d-flex gap-2 align-items-center"><span class="text-muted small flex-grow-1">${o.status}</span>${!o.paid?`<button class="btn btn-sm btn-outline-gold" data-pay="${o.inv}">Bayar</button>`:''}<button class="btn btn-sm btn-gold" data-next="${o.inv}">${['Mulai racik','Siap disajikan','Sudah diantar'][s]}</button></div></div></div></div>`}).join(''):'<p class="text-muted">Tidak ada antrean. Pesanan baru akan muncul di sini.</p>';
}
function nextStatus(inv){const o=orders.find(x=>x.inv==inv);o.status=ST[ST.indexOf(o.status)+1];if(o.status=='Siap Disajikan')bell();save();renderKitchen();updateK()}
async function payLater(inv){
 if(!shift)return Swal.fire('Shift belum dibuka','Buka shift kasir lebih dulu.','info');
 const o=orders.find(x=>x.inv==inv),r=await Swal.fire({title:'Terima '+rp(o.total),text:'Pilih metode pembayaran',showDenyButton:true,showCancelButton:true,confirmButtonText:'Tunai',denyButtonText:'QRIS',confirmButtonColor:'#d4af37'});
 if(r.isDismissed)return;if(r.isDenied&&!(await qrisPopup(o.total)).isConfirmed)return;
 Object.assign(o,{paid:true,method:r.isDenied?'QRIS':'Tunai',cash:o.total,change:0,shift:shift.id});save();renderKitchen();renderAdmin();toast('Pembayaran dicatat');receipt(o);
}

/* ---------- Shift ---------- */
async function shiftFlow(){
 if(!shift){const r=await Swal.fire({title:'Buka shift',input:'number',inputLabel:'Modal awal laci kasir (Rp)',inputValue:500000,showCancelButton:true,confirmButtonText:'Buka shift',confirmButtonColor:'#d4af37'});
  if(!r.isConfirmed)return;shift={id:'S'+Date.now(),start:new Date().toISOString(),float:+r.value||0};save();return renderShift()}
 const mine=orders.filter(o=>o.paid&&o.shift==shift.id),cash=mine.filter(o=>o.method=='Tunai').reduce((a,o)=>a+o.total,0),qr=mine.filter(o=>o.method=='QRIS').reduce((a,o)=>a+o.total,0),exp=shift.float+cash;
 const r=await Swal.fire({title:'Tutup shift',html:`<div class="text-start">Modal awal: <b>${rp(shift.float)}</b><br>Penjualan tunai: <b>${rp(cash)}</b><br>Penjualan QRIS: <b>${rp(qr)}</b><br>Uang seharusnya di laci: <b>${rp(exp)}</b><br>Transaksi: <b>${mine.length}</b></div>`,input:'number',inputLabel:'Hitung uang tunai di laci (Rp)',showCancelButton:true,confirmButtonText:'Tutup shift',confirmButtonColor:'#d4af37'});
 if(!r.isConfirmed)return;const diff=(+r.value||0)-exp;shift=null;save();renderShift();
 Swal.fire(diff==0?'Laci sesuai':'Ada selisih',`Selisih kas: ${diff>=0?'+':'−'}${rp(Math.abs(diff))}`,diff==0?'success':'warning');
}
const renderShift=()=>$('#shiftLbl').textContent=shift?'Tutup Shift':'Buka Shift';

/* ---------- Admin ---------- */
const paidOrders=()=>orders.filter(o=>o.paid),day=d=>new Date(d).toDateString();
function renderAdmin(){
 const p=paidOrders(),td=p.filter(o=>day(o.time)==day(new Date())),sum=a=>a.reduce((s,o)=>s+o.total,0);
 $('#stats').innerHTML=[['Omset hari ini',rp(sum(td)),'bi-graph-up-arrow'],['Transaksi hari ini',td.length,'bi-receipt'],['Total omset',rp(sum(p)),'bi-gem'],['Rata-rata transaksi',rp(p.length?sum(p)/p.length:0),'bi-calculator']].map(([a,b,i])=>`<div class="col-6 col-lg-3"><div class="card"><div class="card-body"><i class="bi ${i} gold"></i> <small class="text-muted">${a}</small><div class="serif h4 mb-0 gold">${b}</div></div></div></div>`).join('');
 const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d}),data=days.map(d=>sum(p.filter(o=>day(o.time)==day(d))));
 if(chart)chart.destroy();chart=new Chart($('#chart'),{type:'bar',data:{labels:days.map(d=>d.toLocaleDateString('id-ID',{day:'2-digit',month:'short'})),datasets:[{label:'Omset (Rp)',data,backgroundColor:'#d4af37',borderRadius:6}]},options:{maintainAspectRatio:false,scales:{y:{beginAtZero:true}}}});
 $('#tMenu').innerHTML=menu.map(m=>`<tr><td>${esc(m.name)}</td><td>${m.cat}</td><td>${rp(m.price)}</td><td>${m.stock<5?`<span class="badge low">${m.stock}</span>`:m.stock}</td><td class="text-end"><button class="btn btn-sm btn-outline-gold" data-edit="${m.id}"><i class="bi bi-pencil"></i></button> <button class="btn btn-sm btn-outline-danger" data-del="${m.id}"><i class="bi bi-trash"></i></button></td></tr>`).join('');
 $('#tHist').innerHTML=[...orders].reverse().map(o=>`<tr><td>${o.inv}</td><td>${new Date(o.time).toLocaleString('id-ID')}</td><td>${o.type}${o.table?' '+o.table:''}</td><td>${o.paid?o.method:'<span class="badge bg-warning text-dark">Belum</span>'}</td><td>${rp(o.total)}</td><td><button class="btn btn-sm btn-outline-gold" data-print="${o.inv}"><i class="bi bi-printer"></i> Struk</button></td></tr>`).join('')||'<tr><td colspan="6" class="text-muted">Belum ada transaksi.</td></tr>';
}
async function editMenu(id){
 const m=menu.find(x=>x.id==id)||{name:'',cat:CATS[0],price:'',stock:'',img:''};
 const r=await Swal.fire({title:id?'Edit menu':'Tambah menu',showCancelButton:true,confirmButtonText:'Simpan',confirmButtonColor:'#d4af37',
 html:`<input id="f1" class="swal2-input" placeholder="Nama menu" value="${esc(m.name)}"><select id="f2" class="swal2-select">${CATS.map(c=>`<option ${c==m.cat?'selected':''}>${c}</option>`).join('')}</select><input id="f3" type="number" class="swal2-input" placeholder="Harga" value="${m.price}"><input id="f4" type="number" class="swal2-input" placeholder="Stok" value="${m.stock}"><input id="f5" class="swal2-input" placeholder="URL foto" value="${esc(m.img)}">`,
 preConfirm:()=>{const n=$('#f1').value.trim(),p=+$('#f3').value;if(!n||p<=0)return Swal.showValidationMessage('Nama dan harga wajib diisi');return{name:n,cat:$('#f2').value,price:p,stock:+$('#f4').value||0,img:$('#f5').value.trim()}}});
 if(!r.isConfirmed)return;id?Object.assign(m,r.value):menu.push({id:Math.max(0,...menu.map(x=>x.id))+1,...r.value});save();renderMenu();renderAdmin();toast('Menu disimpan');
}
function exportCsv(){
 const h=['Invoice','Waktu','Tipe','Meja','Item','Subtotal','Diskon','Poin','PPN','Total','Metode','Status Bayar'],
 rows=orders.map(o=>[o.inv,new Date(o.time).toLocaleString('id-ID'),o.type,o.table,o.items.map(i=>i.qty+'x '+i.name).join('; '),o.sub,o.d,o.red,o.tax,o.total,o.method,o.paid?'Lunas':'Belum']);
 const csv='\ufeff'+[h,...rows].map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\n'),a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='laporan-lucee-kafe.csv';a.click();
}

/* ---------- Role & theme ---------- */
function applyRole(){
 document.querySelectorAll('.staff-only').forEach(e=>e.classList.toggle('d-none',!staff()));
 $('#roleBadge').textContent=staff()?'Mode Kasir / Admin':'Mode Pelanggan';$('#roleLbl').textContent=staff()?'Keluar Kasir':'Masuk Kasir';
 cart.forEach(c=>c.sel=false);renderCart();
}
async function toggleRole(){
 if(staff()){role='customer';return applyRole()}
 const r=await Swal.fire({title:'PIN Kasir',input:'password',inputAttributes:{inputmode:'numeric',maxlength:6,autocomplete:'off'},showCancelButton:true,confirmButtonText:'Masuk',confirmButtonColor:'#d4af37',inputValidator:v=>v!=='1234'&&'PIN salah. Coba lagi.'});
 if(r.isConfirmed){role='staff';applyRole();renderShift()}
}

/* ---------- Events ---------- */
$('#cats').onclick=e=>{const c=e.target.closest('[data-c]');if(c){cat=c.dataset.c;renderMenu()}};
$('#grid').onclick=e=>{const c=e.target.closest('[data-id]');if(c)openItem(c.dataset.id)};
$('#search').oninput=e=>{q=e.target.value.toLowerCase();renderMenu()};
$('#imMinus').onclick=()=>$('#imQty').textContent=qty=Math.max(1,qty-1);
$('#imPlus').onclick=()=>$('#imQty').textContent=qty=Math.min(cur.stock,qty+1);
$('#imAdd').onclick=addToCart;
$('#cartList').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;const c=cart[+b.dataset.i],a=b.dataset.a,m=menu.find(x=>x.id==c.id);
 if(a=='inc'){if(cart.filter(x=>x.id==c.id).reduce((s,x)=>s+x.qty,0)>=m.stock)return toast('Stok maksimal tercapai','warning');c.qty++}
 else if(a=='dec'){if(--c.qty<1)cart.splice(+b.dataset.i,1)}else if(a=='del')cart.splice(+b.dataset.i,1);else c.sel=b.checked;renderCart()};
$('#btnPay').onclick=checkout;$('#payConfirm').onclick=confirmPay;
$('#phone').oninput=()=>{renderMember();renderCart()};$('#usePts').onchange=renderCart;
$('#btnPromo').onclick=()=>{const c=$('#promo').value.trim().toUpperCase(),P={GOLD10:.1,VIP20:.2};if(P[c]){promo={code:c,pct:P[c]};toast('Promo '+c+' aktif')}else{promo=null;toast('Kode promo tidak valid','error')}renderCart()};
document.querySelectorAll('[name=otype]').forEach(r=>r.onchange=()=>$('#table').classList.toggle('d-none',otype()!='Dine-In'));
document.querySelectorAll('[name=method]').forEach(r=>r.onchange=()=>$('#cashBox').classList.toggle('d-none',r.value!='Tunai'&&r.checked));
$('#quick').onclick=e=>{const b=e.target.closest('[data-v]');if(b){$('#cashIn').value=b.dataset.v;$('#cashIn').oninput()}};
$('#cashIn').oninput=()=>{const t=calc(payItems()).total,v=+$('#cashIn').value;$('#chg').innerHTML=v?(v>=t?`Kembalian: <span class="gold">${rp(v-t)}</span>`:`<span class="text-danger">Kurang ${rp(t-v)}</span>`):''};
$('#btnRole').onclick=toggleRole;$('#btnShift').onclick=shiftFlow;
$('#btnKitchen').onclick=()=>{renderKitchen();show('kitchenModal')};$('#btnAdmin').onclick=()=>{renderAdmin();show('adminModal')};
$('#kList').onclick=e=>{const n=e.target.closest('[data-next]'),p=e.target.closest('[data-pay]');if(n)nextStatus(n.dataset.next);if(p)payLater(p.dataset.pay)};
$('#btnAddMenu').onclick=()=>editMenu();$('#btnCsv').onclick=exportCsv;
$('#tMenu').onclick=async e=>{const ed=e.target.closest('[data-edit]'),dl=e.target.closest('[data-del]');if(ed)editMenu(ed.dataset.edit);
 if(dl&&(await Swal.fire({title:'Hapus menu ini?',icon:'warning',showCancelButton:true,confirmButtonText:'Hapus',confirmButtonColor:'#c62828'})).isConfirmed){menu=menu.filter(m=>m.id!=dl.dataset.del);save();renderMenu();renderAdmin()}};
$('#tHist').onclick=e=>{const p=e.target.closest('[data-print]');if(p)receipt(orders.find(o=>o.inv==p.dataset.print))};
$('#btnTheme').onclick=()=>{const l=document.documentElement.dataset.bsTheme!='light';document.documentElement.dataset.bsTheme=l?'light':'dark';$('#btnTheme i').className='bi '+(l?'bi-moon-stars':'bi-sun');localStorage.setItem('lk_theme',l?'light':'dark')};
window.addEventListener('storage',()=>{load();renderMenu();updateK();if($('#kitchenModal').classList.contains('show'))renderKitchen()});
if(localStorage.getItem('lk_theme')=='light')$('#btnTheme').click();
tableOpts();renderMenu();renderCart();renderShift();updateK();
