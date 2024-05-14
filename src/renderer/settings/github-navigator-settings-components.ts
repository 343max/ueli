import { defaultGitHubNavigatorOptions } from "./../../common/config/github-navigator-options";
import Vue from "vue";
import { vueEventDispatcher } from "../vue-event-dispatcher";
import { VueEventChannels } from "../vue-event-channels";
import { PluginSettings } from "./plugin-settings";
import { UserConfigOptions } from "../../common/config/user-config-options";
import { UserConfirmationDialogParams, UserConfirmationDialogType } from "./modals/user-confirmation-dialog-params";
import { TranslationSet } from "../../common/translation/translation-set";
import { deepCopy } from "../../common/helpers/object-helpers";
import { openUrlInBrowser } from "../../main/executors/url-executor";

export const gitHubNavigatorSettingsComponent = Vue.extend({
    data() {
        return { settingName: PluginSettings.GitHubNavigator, visible: false };
    },
    mounted() {
        vueEventDispatcher.$on(VueEventChannels.showSetting, (settingName: string) => {
            if (settingName === this.settingName) {
                this.visible = true;
            } else {
                this.visible = false;
            }
        });
    },
    methods: {
        toggleEnabled() {
            const config: UserConfigOptions = this.config;
            config.gitHubNavigatorOptions.isEnabled = !config.gitHubNavigatorOptions.isEnabled;
            this.updateConfig();
        },
        resetAll() {
            const translations: TranslationSet = this.translations;
            const userConfirmationDialogParams: UserConfirmationDialogParams = {
                callback: () => {
                    const config: UserConfigOptions = this.config;
                    config.gitHubNavigatorOptions = deepCopy(defaultGitHubNavigatorOptions);
                    this.updateConfig();
                },
                message: translations.resetPluginSettingsToDefaultWarning,
                modalTitle: translations.resetToDefault,
                type: UserConfirmationDialogType.Default,
            };
            vueEventDispatcher.$emit(VueEventChannels.settingsConfirmation, userConfirmationDialogParams);
        },
        createToken() {
            openUrlInBrowser("https://github.com/settings/tokens/new?scopes=repo");
        },
        updateConfig() {
            vueEventDispatcher.$emit(VueEventChannels.configUpdated, this.config);
        },
    },
    props: ["config", "translations"],
    template: `
<div v-if="visible">
  <div class="settings__setting-title title is-3">
    <span>
      {{ translations.githubNavigator }}
    </span>
    <div>
      <plugin-toggle :is-enabled="config.gitHubNavigatorOptions.isEnabled" :toggled="toggleEnabled" />
      <button class="button" @click="resetAll">
        <span class="icon">
          <i class="fas fa-undo-alt"></i>
        </span>
      </button>
    </div>
  </div>
  <p class="settings__setting-description" v-html="translations.calculatorDescription"></p>
  <div class="settings__setting-content">
    <div v-if="!config.gitHubNavigatorOptions.isEnabled" class="settings__setting-disabled-overlay"></div>
    <div class="box">
      <div class="settings__option-container">

        <div class="settings__option">
          <div class="settings__option-name">{{ translations.githubPrefix }}</div>
          <div class="settings__option-content">
            <div class="field is-grouped is-grouped-right">
              <div class="control">
                <input class="input font-mono" v-model="config.gitHubNavigatorOptions.prefix" @change="updateConfig">
              </div>
            </div>
          </div>
        </div>
        <div class="settings__option">
          <div class="settings__option-name">{{ translations.githubApiKey }}</div>
          <div class="settings__option-content">
            <div class="field has-addons has-addons-right">
              <div class="control">
                <input class="input font-mono" v-model="config.gitHubNavigatorOptions.apiKey" @change="updateConfig">
              </div>
              <div class="control">
                  <button class="button is-success" @click="createToken">
                      <span class="icon">
                          <i class="fa fa-plus"></i>
                        </span>
                    </button>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`,
});
