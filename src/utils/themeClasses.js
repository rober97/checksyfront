import { computed } from 'vue';
import { useQuasar } from 'quasar';

export function useThemeClasses() {
  const $q = useQuasar();
  const isDark = computed(() => $q.dark.isActive);

  const cardClass = computed(() =>
    isDark.value ? 'bg-grey-9 text-white' : 'bg-white text-dark'
  );

  const bannerAdminClass = computed(() =>
    isDark.value ? 'bg-blue-10 text-white' : 'bg-blue-1 text-dark'
  );

  const bannerCompanyClass = computed(() =>
    isDark.value ? 'bg-green-10 text-white' : 'bg-green-1 text-dark'
  );

  const bannerEmployeeClass = computed(() =>
    isDark.value ? 'bg-orange-10 text-white' : 'bg-orange-1 text-dark'
  );

  const pageContainerClass = computed(() =>
    isDark.value ? 'bg-grey-10 text-white' : 'bg-grey-2 text-dark'
  );

  const headerClass = computed(() =>
  isDark.value ? 'bg-dark text-white' : 'bg-primary text-white'
)



  return {
    isDark,
    cardClass,
    bannerAdminClass,
    bannerCompanyClass,
    bannerEmployeeClass,
    pageContainerClass,
    headerClass
  };
}
