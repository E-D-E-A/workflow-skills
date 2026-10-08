// THROWAWAY: deterministic simulated evidence for ten timeline experiments.
import {events as original,sources as originalSources} from '../../data';
export const DURATION=16*3600;
export const INCIDENT=6*3600+32*60;
export const sources=originalSources.map(s=>({...s,label:s.system}));
export const clock=t=>{const x=Math.max(0,Math.floor(t))+8*3600;return [Math.floor(x/3600),Math.floor(x/60)%60,x%60].map(n=>String(n).padStart(2,'0')).join(':')};
export const duration=s=>s>=3600?(s/3600).toFixed(s%3600?1:0)+' שעות':s>=60?(s/60).toFixed(s%60?1:0)+' דק׳':s+' שנ׳';
export const coverageGap={start:INCIDENT+600,end:INCIDENT+780,source:'sensor'};
const targets=['T-041','T-208','T-312','T-509'];
const labels={messages:'עדכון עקיבה',sensor:'בדיקת קליטה תקינה',services:'בדיקת שירות תקינה',operator:'בחירת מטרה',voice:'דיווח מצב'};
const steps={messages:4,sensor:12,services:8,operator:37,voice:113};
const records=[];
for(const s of sources){
 for(let t=7,i=0;t<DURATION;t+=steps[s.id],i++){
  const target=targets[(i+sources.indexOf(s))%4];
  const phase=Math.floor(t/900)%6;
  if((s.id==='messages'||s.id==='sensor')&&i%(phase+3)===0)continue;
  if(s.id==='operator'&&Math.floor(t/1200)%3===1&&i%3===0)continue;
  if(s.id==='sensor'&&t>=coverageGap.start&&t<coverageGap.end)continue;
  if(s.id==='operator'&&target==='T-041'&&t>=INCIDENT&&t<INCIDENT+102)continue;
  if(s.id==='services'&&t>=INCIDENT+1&&t<INCIDENT+147)continue;
  const id='SIM-'+s.id+'-'+i;
  records.push({id,t,source:s.id,target,title:labels[s.id],severity:'normal',
   ...(s.id==='voice'?{end:Math.min(DURATION,t+8+i%17),soft:true}:{}),
   detail:'רשומת רקע מסומלצת לבדיקת עומס וקריאות. מזהה המטרה מאפשר הצלבה בין המקורות.',
   raw:{event_id:id,system:s.id,target,timestamp:clock(t),kind:'simulated_background'}});
 }
}
const offset=INCIDENT-120;
for(const e of original.filter(e=>!e.derived))records.push({...e,t:e.t+offset,...(e.end?{end:e.end+offset}:{}),anchor:true});
for(let i=0;i<80;i++)records.push({id:'ARCH-'+i,t:INCIDENT+2400+i*2,source:'services',target:'ARCHIVE',severity:'warning',title:'ניסיון ארכוב חוזר',detail:'מקבץ שגיאות בשירות הארכוב. אין מזהה הודעה משותף לתרחיש ההתרעה.',raw:{service:'archive',retry:i}});
records.push({id:'SENSOR-QUALITY',t:INCIDENT+7200,end:INCIDENT+7290,source:'sensor',target:'SENSOR-A',severity:'warning',title:'איכות קליטה נמוכה',detail:'ירידה מדומה באיכות הקליטה למשך 90 שניות; אין קשר מוכח לשירות ההתרעות.'});
export const recordsAll=records.sort((a,b)=>a.t-b.t||a.id.localeCompare(b.id));
export const stateSpans=[
 {source:'messages',start:0,end:DURATION,label:'קליטה פעילה',kind:'normal',evidence:'EV-106'},
 {source:'sensor',start:0,end:coverageGap.start,label:'קליטה תקינה',kind:'normal',evidence:'EV-108'},
 {source:'sensor',start:coverageGap.start,end:coverageGap.end,label:'חסר קובץ מקור · מצב לא ידוע',kind:'unknown'},
 {source:'sensor',start:coverageGap.end,end:INCIDENT+7200,label:'קליטה תקינה',kind:'normal',evidence:'EV-114'},
 {source:'sensor',start:INCIDENT+7200,end:INCIDENT+7290,label:'איכות נמוכה',kind:'warning',evidence:'SENSOR-QUALITY'},
 {source:'sensor',start:INCIDENT+7290,end:DURATION,label:'קליטה תקינה',kind:'normal',evidence:'EV-114'},
 {source:'services',start:0,end:INCIDENT+1,label:'שירות התרעות זמין',kind:'normal',evidence:'EV-107'},
 {source:'services',start:INCIDENT+1,end:INCIDENT+147,label:'שירות התרעות לא זמין',kind:'critical',evidence:'EV-107'},
 {source:'services',start:INCIDENT+147,end:DURATION,label:'שירות התרעות זמין',kind:'normal',evidence:'EV-112'},
 {source:'operator',start:INCIDENT,end:INCIDENT+102,label:'ללא פעולה מתועדת ל־T-041',kind:'derived',evidence:'EV-111'},
 {source:'voice',start:INCIDENT+89,end:INCIDENT+100,label:'״לא קיבלתי התרעה״',kind:'soft',evidence:'EV-110'}
];
export function binsFor(records,start,end,count=40){
 const size=(end-start)/count;
 const bins=Array.from({length:count},(_,i)=>({start:start+i*size,end:start+(i+1)*size,count:0,alert:0,bySource:Object.fromEntries(sources.map(s=>[s.id,0]))}));
 for(const e of records){if(e.t<start||e.t>=end)continue;const b=bins[Math.min(count-1,Math.floor((e.t-start)/size))];b.count++;b.bySource[e.source]++;if(e.severity!=='normal')b.alert++}
 return bins;
}
export const options=[
 {key:'T1',name:'Source lanes',title:'מסלולים לפי מערכת',question:'מה קרה במערכות השונות באותו רגע?',hint:'מבט רחב מציג מקבצי זמן; זום מפריד אותם לרשומות ולאינטרוולים.',tradeoff:'נקודת מוצא טבעית לתחקיר; מספר רב של מערכות דורש קיבוץ מסלולים.'},
 {key:'T2',name:'Density matrix',title:'מפת צפיפות',question:'באיזו מערכת ובאיזה חלון מסתתר דפוס חריג?',hint:'עוצמת התא = מספר רשומות. מסגרת כתומה = לפחות חריגה אחת.',tradeoff:'מצוינת לסריקת שעות רבות; הסדר המדויק נחשף רק בפתיחת תא.'},
 {key:'T3',name:'Activity river',title:'זרם הפעילות',question:'מתי השתנה נפח הפעילות, ומי תרם לשינוי?',hint:'גובה הזרם = נפח רשומות; כל שכבה היא מערכת. לחצו על חלון להעמקה.',tradeoff:'מבליטה התפרצויות ושינוי בתמהיל; מקור רועש עלול להאפיל על מקורות שקטים.'},
 {key:'T4',name:'Entity tracks',title:'מסלולים לפי ישות',question:'מה עבר על אותה מטרה בכל המערכות?',hint:'השורות הן מטרות ורכיבים; צבע הרשומה מציין את המערכת המדווחת.',tradeoff:'טובה להצלבה בין מערכות; איכות המבט תלויה בזמינות מזהים משותפים.'},
 {key:'T5',name:'State ribbons',title:'מצבים ורציפות',question:'איזה מצב נמשך, ומה התרחש במקביל אליו?',hint:'אינטרוולים מציגים מצב, פער נתונים ואי־פעולה בנפרד; לחצו כדי לבדוק את הראיות.',tradeoff:'מבליטה משכים וחפיפות; מחייבת מודל מצבים וכללי גזירת מצב מוסכמים.'},
 {key:'T6',name:'Chronicle',title:'יומן מסונכרן',question:'מה כל מערכת תיעדה בכל פרק זמן?',hint:'הזמן מתקדם מלמעלה למטה; עמודות המערכות מיושרות לאותו חלון.',tradeoff:'קריאה מילולית ונוחה בחדר תחקיר; השוואת זמנים רחוקים דורשת גלילה.'},
 {key:'T7',name:'Time lens',title:'עדשת זמן',question:'איך בודקים שניות בלי לאבד את הסיפור של כל היום?',hint:'בחרו נקודה בפס היום. העדשה פותחת חמש דקות, עם ההקשר המלא מעליה.',tradeoff:'משלבת הקשר ופירוט; חשוב להבחין בין שני סולמות הזמן.'},
 {key:'T8',name:'Message paths',title:'מסלול הודעה',question:'עד איפה הגיעה הודעה, ואיפה חסרה ראיית המשך?',hint:'בחרו מזהה משותף. הקווים מראים רק העברות המתועדות בתרחיש.',tradeoff:'חזקה לאיתור פער במסירה; אינה תחליף לסריקה כללית כשאין מזהה מקשר.'},
 {key:'T9',name:'Small multiples',title:'דופק לכל מערכת',question:'האם שינוי במקור אחד מופיע גם במקור אחר?',hint:'אותו ציר זמן בחמישה גרפים. לכל מערכת סולם נפח משלה כדי לחשוף גם מקורות שקטים.',tradeoff:'טובה להשוואת תבניות; אין להשוות גובה מוחלט בין גרפים בעלי סולם שונה.'},
 {key:'T10',name:'Window comparison',title:'חלון מול חלון',question:'מה שונה בחלון האירוע לעומת חלון השוואה?',hint:'שני חלונות של חמש דקות מיושרים לזמן יחסי. החליפו את נקודת ההשוואה.',tradeoff:'מבליטה שינוי מול שגרה; בחירת חלון השוואה לא מייצג עלולה להטעות.'}
];