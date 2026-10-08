<script setup>
import LensOverview from './LensOverview.vue';import LensTimeline from './LensTimeline.vue';import EvidenceInspector from './EvidenceInspector.vue';
</script><template><div class="lens-variant variant-2"><LensOverview mode="volume"/><div class="variant-divider">מהסקירה אל הפרטים</div><LensTimeline mode="signals"/><EvidenceInspector mode="stacked"/></div></template>