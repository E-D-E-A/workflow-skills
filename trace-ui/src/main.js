import { createApp } from 'vue';
async function start(){
const original=new URLSearchParams(location.search).get('variant')==='original';
if(original){
 const [{default:App}]=await Promise.all([import('./App.vue'),import('./style.css')]);
 createApp(App).mount('#app');
}else{
 const [{default:App}]=await Promise.all([import('./prototypes/PrototypeApp.vue'),import('./prototypes/prototypes.css')]);
 createApp(App).mount('#app');
}

}
start();
