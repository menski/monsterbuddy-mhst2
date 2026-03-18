import useHistoryStore from '~/stores/historyStore';
import useMonsterFilter from '~/stores/monsterFilter';
import useMonstieFilter from '~/stores/monstieFilter';
import useEggFilter from '~/stores/eggFilter';
import useEldersLairFilter from '~/stores/eldersLairFilter';

export default (context, inject) => {
  inject('useHistoryStore', useHistoryStore);

  useHistoryStore()?.loadFromStorage();

  [
    useMonsterFilter(),
    useMonstieFilter(),
    useEggFilter(),
    useEldersLairFilter(),
  ].forEach((store) => {
    store?.loadFromStorage?.();
    store?.initializePersistence?.();
  });
};
