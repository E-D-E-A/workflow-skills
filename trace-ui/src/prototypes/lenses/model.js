// THROWAWAY: eight dark-mode refinements of the operator-selected time-lens layout.
import {inject} from 'vue';
export {sources,recordsAll,DURATION,INCIDENT,clock,duration,binsFor,coverageGap} from '../timelines/data';
export const useLens=()=>inject('lens');
export const designs=[
 {key:'L1',name:'Focus',title:'מיקוד שקט',description:'סקירה דקה, נקודות נקיות וראיה פתוחה. מינימום הפרעות בין הסריקה לפרטים.'},
 {key:'L2',name:'Signals',title:'חריגות במבט ראשון',description:'נפח הפעילות מעל הציר; סימני אזהרה ומונה חריגות בכל מערכת.'},
 {key:'L3',name:'Chapters',title:'חלונות ברורים',description:'מקטעי זמן מובחנים, בחירה מודגשת ופרטי מקור בקבוצות קריאות.'},
 {key:'L4',name:'Precision',title:'דיוק בזמן',description:'סרגל מדויק, קו זמן משותף ונתוני מקור לצד מטא־דאטה.'},
 {key:'L5',name:'Review',title:'חדר תחקיר',description:'שמות מערכות וטקסט גדולים, מסלולים רחבים וקריאה משותפת של הראיה.'},
 {key:'L6',name:'Connections',title:'ראיות קשורות',description:'הדגשת מזהי הודעה משותפים וצבירת כמה ראיות לשאלה אחת.'},
 {key:'L7',name:'Instruments',title:'מערכת אחר מערכת',description:'אזור נפרד לכל מערכת, סיכום החריגות שלה ונתונים בסגנון מפקח מאפיינים.'},
 {key:'L8',name:'Workspace',title:'מרחב העבודה',description:'ציר פתוח ללא מסגרות, כלי בחירה צפים ומגירת מקור רחבה מתחתיו.'}
];
export const reason=e=>e.severity==='critical'?'הרשומה סומנה קריטית במקור המדומה.':e.severity==='warning'?'הרשומה סומנה חריגה בתרחיש המדומה.':'הרשומה אינה מסומנת חריגה.';
export const rawRecord=e=>e.raw??{event_id:e.id,source:e.source,timestamp:e.t,target:e.target,severity:e.severity,title:e.title,detail:e.detail,...(e.end?{end_timestamp:e.end}:{}),time_unit:'seconds_since_08:00'};
