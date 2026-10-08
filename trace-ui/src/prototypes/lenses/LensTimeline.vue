<script setup>
import {computed,onMounted,onUnmounted,ref} from 'vue';
import {useLens,sources,clock,duration,coverageGap} from './model';
import {ChevronLeft,ChevronRight,Minus,Plus,AtSign,Radio,Radar,MousePointer2,Server,AudioLines,TriangleAlert} from 'lucide-vue-next';
const props=defineProps({mode:{default:'quiet'}});
const {state,visible,setRange,select,attach,incident,relatedIds}=useLens();
const root=ref(null),width=ref(800),hover=ref(null);let observer;
const icons={messages:Radio,sensor:Radar,operator:MousePointer2,services:Server,voice:AudioLines};
const px=t=>Math.max(0,Math.min(100,(t-state.start)/state.span*100));
const rows=computed(()=>sources.map(s=>{
 const entries=visible.value.filter(e=>e.source===s.id);const ends=[];
 const marks=entries.map(e=>{const position=px(e.t)/100*width.value;let lane=ends.findIndex(x=>x+28<=position);if(lane<0)lane=ends.length;ends[lane]=position;return {e,lane}});
 return {...s,marks,height:Math.max(props.mode==='review'?92:70,Math.max(1,ends.length)*28+24),alerts:entries.filter(e=>e.severity!=='normal').length};
}));
const totalAlerts=computed(()=>visible.value.filter(e=>e.severity!=='normal').length);
const selected=computed(()=>visible.value.find(e=>e.id===state.selectedId));
const cursor=computed(()=>props.mode==='precision'?(hover.value||selected.value):selected.value);
function click(e,event){select(e.id,!event.shiftKey);if(event.shiftKey)attach(e.id)}
function move(amount){setRange(state.start+amount,state.span)}
function zoom(factor){const span=Math.max(30,Math.min(1800,state.span*factor));setRange(state.start+(state.span-span)/2,span)}
onMounted(()=>{observer=new ResizeObserver(()=>{width.value=root.value?.querySelector('.dots-track')?.clientWidth||800});observer.observe(root.value)});
onUnmounted(()=>observer?.disconnect());
</script><template><section ref="root" class="lens-detail" :class="'detail-'+mode" aria-label="ציר מפורט לפי מערכת">
<header class="detail-heading"><div><span class="section-label">החלון שנבחר</span><h2 dir="ltr">{{clock(state.start)}} <span>—</span> {{clock(state.start+state.span)}}</h2><small>{{duration(state.span)}} · {{visible.length}} פריטי מידע <span v-if="totalAlerts">· {{totalAlerts}} מסומנים לבדיקה</span></small></div><div class="lens-controls glass"><button @click="move(-state.span/2)" aria-label="חלון קודם"><ChevronLeft/></button><button @click="zoom(.5)" aria-label="הגדלה"><Plus/></button><button @click="zoom(2)" aria-label="הקטנה"><Minus/></button><button @click="move(state.span/2)" aria-label="חלון הבא"><ChevronRight/></button><button class="text-control" @click="incident">האירוע</button></div></header>
<div v-if="mode==='signals'" class="signal-caption"><TriangleAlert/><span>{{totalAlerts}} פריטים מסומנים לבדיקה</span><small>סימון מהמקור המדומה; אינו מסקנה של הסוכן.</small></div>
<div v-if="mode==='connections'&&selected?.raw?.message_id" class="correlation-strip"><span>מזהה הודעה משותף <code>{{selected.raw.message_id}}</code></span><button @click="attach(selected.id)"><AtSign/>{{selected.id}}</button><button v-for="id in relatedIds" :key="id" @click="attach(id)"><AtSign/>{{id}}</button></div><div class="dot-axis"><span>מערכת מקור</span><div dir="ltr"><time v-for="i in (mode==='precision'?7:5)" :key="i">{{clock(state.start+state.span*(i-1)/(mode==='precision'?6:4))}}</time></div></div>
<div class="system-lanes">
<div v-for="s in rows" :key="s.id" class="system-lane" :style="{minHeight:s.height+'px'}"><div class="system-identity"><component :is="icons[s.id]"/><div><strong>{{s.label}}</strong><small>{{s.marks.length}} פריטים<span v-if="s.alerts"> · {{s.alerts}} חריגים</span></small></div></div>
<div class="dots-track" dir="ltr" :style="{height:s.height+'px'}">
<div v-if="cursor" class="shared-cursor" :style="{left:px(cursor.t)+'%'}"></div>
<div v-if="s.id==='sensor'&&state.start<coverageGap.end&&state.start+state.span>coverageGap.start" class="coverage-gap" :style="{left:px(coverageGap.start)+'%',width:px(coverageGap.end)-px(coverageGap.start)+'%'}" title="קובץ מקור חסר; אין להסיק שלא הייתה פעילות">חסר מקור</div>
<div v-for="{e,lane} in s.marks" :key="e.id" class="mark-group" :style="{left:px(e.t)+'%',top:12+lane*28+'px'}">
<span v-if="e.end" class="duration-stroke" :class="{suspicious:e.severity!=='normal',soft:e.soft}" :style="{width:Math.max(2,(px(e.end)-px(e.t))*width/100)+'px'}"></span>
<button class="data-point" :data-id="e.id" :class="{suspicious:e.severity!=='normal',critical:e.severity==='critical',selected:state.selectedId===e.id,soft:e.soft,attached:state.tags.includes(e.id),related:mode==='connections'&&relatedIds.includes(e.id)}" :aria-label="clock(e.t)+' · '+e.title+' · '+e.target+(e.severity!=='normal'?' · חשוד לבדיקה':'')" :aria-pressed="state.selectedId===e.id" :title="clock(e.t)+' · '+e.title+' · '+e.target" @click="click(e,$event)" @mouseenter="hover=e" @mouseleave="hover=null" @focus="hover=e" @blur="hover=null"><span class="point-core">{{e.severity!=='normal'?'!':''}}</span></button>
<span v-if="mode==='review'&&e.anchor&&e.severity!=='normal'" class="point-caption">{{e.title}}</span>
</div>
</div></div></div>
<div class="plot-caption"><div><span class="normal-example"></span>פריט מידע <span class="alert-example">!</span> לבדיקה <span class="duration-example"></span>משך</div><span>לחיצה: מקור · Shift + לחיצה: צירוף לצ׳אט</span></div>
<div v-if="hover" class="hover-readout" aria-live="polite"><b>{{hover.title}}</b><span>{{clock(hover.t)}} · {{hover.target}}{{hover.end?' · '+duration(hover.end-hover.t):''}}</span><small v-if="hover.severity!=='normal'">סומן {{hover.severity==='critical'?'קריטי':'חריג'}} במקור המדומה</small></div>
<div v-if="selected" class="point-actions"><div><span class="section-label">נבחר</span><strong>{{selected.title}}</strong><code>{{selected.id}}</code></div><button class="attach-point" @click="attach(selected.id)"><AtSign/>{{state.tags.includes(selected.id)?'צורף לצ׳אט':'צירוף לצ׳אט'}}</button></div>
<p v-if="!visible.length" class="lens-empty">אין פריטים בחלון תחת הסינון הנוכחי.</p>
</section></template>