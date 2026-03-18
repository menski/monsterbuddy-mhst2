<template>
  <div class="relative flex h-full min-h-[122px] items-start gap-2 py-2 pl-2 pr-2">
    <div class="w-24 flex-shrink-0 flex flex-col gap-2 items-center">
      <div
        class="flex h-24 w-24 items-center justify-center overflow-hidden rounded"
        :class="mediaClasses"
        :title="mediaTitle"
        role="button"
        tabindex="0"
        @click.stop.prevent="toggleMedia"
        @keydown.enter.stop.prevent="toggleMedia"
        @keydown.space.stop.prevent="toggleMedia"
      >
        <MonsterImage
          v-if="showMonsterImage"
          class="max-h-[88px] max-w-[88px]"
          :monster="monster"
          hideFallback
        />

        <MonsterIcon v-else class="scale-90" :monster="monster" />
      </div>

      <img
        v-if="monster.hatchable"
        :src="require('~/assets/icons/hatchable.svg')"
        alt="Hatchable"
        title="Hatchable"
        width="20"
        height="20"
        class="w-8 h-8"
      >
    </div>

    <div class="flex-1 min-w-0 pt-1 text-sm whitespace-nowrap">
      <div
        class="leading-tight text-gray-500 dark:text-cool-400"
        v-text="info"
      />
      <div
        class="text-base font-semibold leading-snug"
        v-text="monster.name"
      />

      <template v-if="showLocation || showRarity">
        <div v-text="monster.genus" />
        <div v-text="monster.habitat" />

        <div
          v-if="showLocation && location"
          v-text="location"
        />

        <div v-if="showRarity">
          Rarity <span
            class="font-bold"
            v-text="monster.rarity"
          />
        </div>
      </template>

      <template v-if="showCoopQuests">
        <div
          v-for="coopQuest in coopQuests"
          :key="coopQuest"
        >
          {{ coopQuest }}
        </div>
      </template>

      <template v-if="showEldersLairFloors">
        <div
          v-for="floor in eldersLairFloors"
          :key="floor"
        >
          Elder's Lair - {{ floor }}
        </div>
      </template>

      <template v-if="showCombat">
        <div
          v-for="(attackType, phase) in monster.monster.attackPatterns"
          :key="phase"
          class="flex items-center gap-2 whitespace-normal"
        >
          <span
            class="w-[5.5rem] flex-shrink-0 text-gray-500 dark:text-cool-400"
            v-text="formatPhase(phase)"
          />

          <div class="flex items-center gap-1">
            <AttackTypeIcon
              class="w-5 h-5"
              :type="getCounterAttackType(attackType)"
            />
            <span class="font-semibold text-gray-500 dark:text-cool-400">
              &gt;
            </span>
            <AttackTypeIcon
              class="w-5 h-5"
              :type="attackType"
            />
          </div>
        </div>
      </template>

      <template v-if="showCombatDetailed">
        <div class="mt-1 space-y-1 whitespace-normal text-[13px] leading-tight">
          <div
            v-for="(attackType, phase) in monster.monster.attackPatterns"
            :key="phase"
            class="flex items-center gap-2"
          >
            <span
              class="w-[5.5rem] flex-shrink-0 text-gray-500 dark:text-cool-400"
              v-text="formatPhase(phase)"
            />

            <div class="flex items-center gap-1">
              <AttackTypeIcon
                class="w-5 h-5"
                :type="getCounterAttackType(attackType)"
              />
              <span class="font-semibold text-gray-500 dark:text-cool-400">
                &gt;
              </span>
              <AttackTypeIcon
                class="w-5 h-5"
                :type="attackType"
              />
            </div>
          </div>

          <div
            v-if="hasElementalWeakness"
            class="flex items-start gap-2"
          >
            <span class="w-[5.5rem] flex-shrink-0 text-gray-500 dark:text-cool-400">
              Weakness
            </span>

            <div class="flex flex-wrap gap-x-3 gap-y-1">
              <div
                v-for="(weakness, label) in elementalWeaknesses"
                :key="label"
                class="flex items-center"
              >
                <ElementIcon
                  class="w-5 h-5 mr-1"
                  :element="weakness"
                />
                <ElementLabel
                  class="font-semibold"
                  :element="weakness"
                />
                <span
                  v-if="label !== 'DEFAULT'"
                  class="ml-1 text-gray-500 dark:text-cool-400"
                >
                  ({{ label }})
                </span>
              </div>
            </div>
          </div>

          <div
            v-for="partGroup in groupedPartEffectiveness"
            :key="partGroup.key"
            class="flex items-center gap-2"
          >
            <span
              class="w-[5.5rem] flex-shrink-0 text-gray-500 dark:text-cool-400"
              v-text="partGroup.label"
            />

            <div class="flex min-w-[4.5rem] flex-nowrap items-center gap-1">
              <WeaponTypeIcon
                v-for="type in partGroup.weaponTypes"
                :key="type"
                :type="type"
                class="w-5 h-5"
              />
            </div>
          </div>
        </div>
      </template>
    </div>

    <div
      v-if="ticket"
      class="absolute top-0 right-0 px-2 py-0.5 rounded-bl text-xs font-semibold tracking-widest bg-gold/75 dark:bg-gold/25 text-gray-700 dark:text-gold"
      title="Golden SR ticket required"
    >
      SR
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import {
    formatMonsterInfo,
    formatMonsterPrimaryLocation,
    formatCoopQuest,
    formatPhase,
    getCounterAttackType,
  } from '~/services/utils';
  import { coopQuests, getMonsterLocations } from '~/services/data';

  export default {
    name: 'MonsterListItem',

    props: {
      monster: {
        type: Object,
        required: true,
      },

      mode: {
        type: String,
        required: false,
        default: 'location',
      },

      ticket: {
        type: String,
        required: false,
        default: null,
      },
    },

    data() {
      return {
        showMonsterImageOverride: false,
      };
    },

    computed: {
      info() {
        return formatMonsterInfo(this.monster);
      },

      monsterImageUrl() {
        try {
          return require(`~/assets/monsters-small/${this.monster.name}.webp`);
        } catch (e) {
          return null;
        }
      },

      location() {
        return formatMonsterPrimaryLocation(this.monster);
      },

      coopQuests() {
        let locations = _.take(getMonsterLocations(this.monster, 'coopQuest'), 3);

        let quests = _.map(locations, (location) => {
          return _.find(coopQuests, { name: location.main });
        });

        return _.map(quests, formatCoopQuest);
      },

      eldersLairFloors() {
        let locations = _.take(
          getMonsterLocations(this.monster, 'eldersLair'),
          3
        );

        return _.map(locations, 'main');
      },

      showLocation() {
        return _.includes(['location'], this.mode);
      },

      showCoopQuests() {
        return _.includes(['location-coop'], this.mode);
      },

      showEldersLairFloors() {
        return _.includes(['location-eldersLair'], this.mode);
      },

      showCombat() {
        return _.includes(['combat'], this.mode);
      },

      showCombatDetailed() {
        return _.includes(['combat-detailed'], this.mode);
      },

      showRarity() {
        return _.includes(['rarity'], this.mode);
      },

      hasElementalWeakness() {
        return this.monster?.monster?.elementalWeakness != null;
      },

      elementalWeaknesses() {
        let result = this.monster?.monster?.elementalWeakness;

        if (!_.isObject(result)) {
          result = { DEFAULT: result };
        }

        return result;
      },

      groupedPartEffectiveness() {
        return _.reduce(
          this.monster?.monster?.parts,
          (result, weaponTypes, part) => {
            let effectiveWeaponTypes = this.getEffectiveWeaponTypes(weaponTypes);
            let key = effectiveWeaponTypes.join('|') || 'none';
            let existingGroup = _.find(result, { key });

            if (existingGroup) {
              existingGroup.parts.push(this.formatPart(part));
              existingGroup.label = existingGroup.parts.join(', ');
            } else {
              result.push({
                key,
                label: this.formatPart(part),
                parts: [this.formatPart(part)],
                weaponTypes: effectiveWeaponTypes,
              });
            }

            return result;
          },
          []
        );
      },

      hasMonsterImage() {
        return !!this.monsterImageUrl;
      },

      showMonsterImage() {
        return this.showMonsterImageOverride && this.hasMonsterImage;
      },

      mediaTitle() {
        if (!this.hasMonsterImage) {
          return this.monster.name;
        }

        if (this.showMonsterImage) {
          return 'Show icon';
        }

        return 'Show in-game image';
      },

      mediaClasses() {
        if (!this.hasMonsterImage) {
          return null;
        }

        return 'cursor-pointer transition-colors-slow-interactive hover:bg-gray-100 dark:hover:bg-cool-900/50';
      },
    },

    methods: {
      formatPhase,
      getCounterAttackType,

      formatPart(part) {
        if (part === 'DEFAULT') {
          return 'Default';
        }
        return part;
      },

      getEffectiveWeaponTypes(types = []) {
        return _.filter(['slash', 'pierce', 'blunt'], (type) => {
          return _.includes(types, type);
        });
      },

      toggleMedia() {
        if (!this.hasMonsterImage) {
          return;
        }

        this.showMonsterImageOverride = !this.showMonsterImageOverride;
      },
    },
  };
</script>
