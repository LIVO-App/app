<template>
  <div class="ion-padding-horizontal">
    <!-- Global alert used by the proposition workflow (errors, confirmations, success). -->
    <ion-alert
      :is-open="alert_open"
      :header="alert_information.title"
      :message="alert_information.message"
      :buttons="alert_information.buttons"
      @didDismiss="closeModal(true)"
      :inputs="alert_information.inputs"
    />
    <!--<ion-modal
      id="addition"
      :is-open="addition"
      @didDismiss="closeModal(false)"
      class="fit"
    >
      <suspense>
        <template #default>
          <course-additions
            :title="correspondences[pages[current_page_index]].card"
          />
        </template>
        <template #fallback>
          <loading-component />
        </template>
      </suspense>
    </ion-modal>-->
    <!-- TODO (4): aggiungere pulsante aggiunta immagini -->
    <div class="ion-margin-top ion-margin-start">
      <!-- Top-level navigation / back button. -->
      <ionic-element
        :element="buttons[3]"
        @execute_link="$router.push(store.state.request.url)"
      />

      <!-- Admin-only actions: approve/reject and toggle between view/edit. -->
      <div v-if="user.type == 'admin' && !allApproed()" class="ion-padding-top">
        <ionic-element
          v-if="action == 'view'"
          :element="buttons[4]"
          @signal_event="setupModalAndOpen('confirm', undefined, true)"
        />
        <ionic-element
          v-if="action == 'view'"
          :element="buttons[5]"
          @signal_event="setupModalAndOpen('confirm', undefined, false)"
        />
        <ionic-element
          :element="action == 'view' ? buttons[6] : buttons[7]"
          @signal_event="changeModality(action == 'view' ? 'edit' : 'view')"
        />
      </div>
    </div>

    <!-- Reference model selector (enabled only when proposing a new course). -->
    <custom-select
      :key="trigger"
      v-model:selected_option="selected_model"
      :list="models"
      :label="getCurrentElement('reference_model') + ':'"
      :aria_label="getCurrentElement('reference_model')"
      :placeholder="getCurrentElement('possible_models')"
      :getCompleteName="modelToString"
      :disabled="action != 'propose'"
    />
    <!-- TODO (4): mettere filtro su modelli -->

    <!-- Wizard-like card: renders the current page and its inputs. -->
    <ion-card :key="trigger">
      <ion-card-header>
        <ion-card-title class="ion-text-center" color="white">{{
          getCurrentElement(
            ModelProposition.getTitles()[pages[current_page_index]]
          )
        }}</ion-card-title>
      </ion-card-header>
      <ion-card-content style="overflow-y: auto">
        <ion-grid>
          <!-- Wizard pages rendered as localized fields (title + rich-text editor pages). -->
          <template
            v-if="
              pages[current_page_index] == 'title' ||
              ModelProposition.getProps('editor').findIndex(
                (a) => a == pages[current_page_index]
              ) != -1
            "
          >
            <ion-row v-for="language in languages" :key="language">
              <ion-col>
                <!-- Page: Title (per-language plain input). -->
                <ion-input
                  v-if="pages[current_page_index] == 'title'"
                  type="text"
                  v-model="
                    castToTitles(course_proposition[pages[current_page_index]])[
                      `${language}_title`
                    ]
                  "
                  :label="getCurrentElement(language)"
                  :aria-label="getCurrentElement(language)"
                  fill="outline"
                  class="ion-margin-vertical"
                  :readonly="
                    action == 'view' ||
                    (action == 'edit' && language == 'italian') ||
                    (approved.course &&
                      ModelProposition.getPropositionProps('optional').indexOf(
                        `${language}_title`
                      ) == -1)
                  "
                />
                <!--<ion-textarea
                  v-else
                  v-model="
                    castToLanguageObj(course_proposition[pages[current_page_index]])[`${language}_descr exp_l cri act`]
                  "
                  :label="getCurrentElement(language)"
                  :aria-label="getCurrentElement(language)"
                  fill="outline"
                  class="ion-margin-vertical"
                />-->
                <div
                  v-else-if="pages[current_page_index] == 'description'"
                  class="ion-margin-vertical"
                >
                  <!-- Page: Description (per-language rich-text editor). -->
                  <b
                    ><ionic-element
                      :element="
                        getCustomMessage(
                          `${language}_descr`,
                          getCurrentElement(language)
                        )
                      "
                  /></b>
                  <editor-wrapper
                    v-model:value="
                      castToDescription(
                        course_proposition[pages[current_page_index]]
                      )[`${language}_descr`]
                    "
                    :disabled="
                      action == 'view' ||
                      (approved.course &&
                        ModelProposition.getPropositionProps(
                          'optional'
                        ).indexOf(`${language}_descr`) == -1)
                    "
                    :options="
                      action == 'view' ||
                      (approved.course &&
                        ModelProposition.getPropositionProps(
                          'optional'
                        ).indexOf(`${language}_descr`) == -1)
                        ? {
                            modules: {
                              toolbar: false,
                            },
                            placeholder: false,
                          }
                        : undefined
                    "
                  />
                </div>
                <div
                  v-else-if="
                    pages[current_page_index] == 'expected_learning_results'
                  "
                  class="ion-margin-vertical"
                >
                  <!-- Page: Expected learning results (per-language rich-text editor). -->
                  <b
                    ><ionic-element
                      :element="
                        getCustomMessage(
                          `${language}_exp_l`,
                          getCurrentElement(language)
                        )
                      "
                  /></b>
                  <editor-wrapper
                    v-model:value="
                      castToExpectedLearningResults(
                        course_proposition[pages[current_page_index]]
                      )[`${language}_exp_l`]
                    "
                    :disabled="
                      action == 'view' ||
                      (approved.course &&
                        ModelProposition.getPropositionProps(
                          'optional'
                        ).indexOf(`${language}_exp_l`) == -1)
                    "
                    :options="
                      action == 'view' ||
                      (approved.course &&
                        ModelProposition.getPropositionProps(
                          'optional'
                        ).indexOf(`${language}_exp_l`) == -1)
                        ? {
                            modules: {
                              toolbar: false,
                            },
                            placeholder: false,
                          }
                        : undefined
                    "
                  />
                </div>
                <div
                  v-else-if="pages[current_page_index] == 'criterions'"
                  class="ion-margin-vertical"
                >
                  <!-- Page: Assessment criterions (per-language rich-text editor). -->
                  <b
                    ><ionic-element
                      :element="
                        getCustomMessage(
                          `${language}_cri`,
                          getCurrentElement(language)
                        )
                      "
                  /></b>
                  <editor-wrapper
                    v-model:value="
                      castToCriterions(
                        course_proposition[pages[current_page_index]]
                      )[`${language}_cri`]
                    "
                    :disabled="
                      action == 'view' ||
                      (approved.course &&
                        ModelProposition.getPropositionProps(
                          'optional'
                        ).indexOf(`${language}_cri`) == -1)
                    "
                    :options="
                      action == 'view' ||
                      (approved.course &&
                        ModelProposition.getPropositionProps(
                          'optional'
                        ).indexOf(`${language}_cri`) == -1)
                        ? {
                            modules: {
                              toolbar: false,
                            },
                            placeholder: false,
                          }
                        : undefined
                    "
                  />
                </div>
                <div
                  v-else-if="pages[current_page_index] == 'activities'"
                  class="ion-margin-vertical"
                >
                  <!-- Page: Activities (per-language rich-text editor). -->
                  <b
                    ><ionic-element
                      :element="
                        getCustomMessage(
                          `${language}_act`,
                          getCurrentElement(language)
                        )
                      "
                  /></b>
                  <editor-wrapper
                    v-model:value="
                      castToActivities(
                        course_proposition[pages[current_page_index]]
                      )[`${language}_act`]
                    "
                    :disabled="
                      action == 'view' ||
                      (approved.course &&
                        ModelProposition.getPropositionProps(
                          'optional'
                        ).indexOf(`${language}_act`) == -1)
                    "
                    :options="
                      action == 'view' ||
                      (approved.course &&
                        ModelProposition.getPropositionProps(
                          'optional'
                        ).indexOf(`${language}_act`) == -1)
                        ? {
                            modules: {
                              toolbar: false,
                            },
                            placeholder: false,
                          }
                        : undefined
                    "
                  />
                </div>
              </ion-col>
            </ion-row>
          </template>

          <!-- Page: Characteristics #1 (numbers + learning area selection). -->
          <template v-else-if="pages[current_page_index] == 'characteristics1'">
            <ion-row>
              <ion-col>
                <ion-input
                  type="number"
                  v-model="
                    castToCharacteristics1(
                      course_proposition[pages[current_page_index]]
                    ).credits
                  "
                  :label="getCurrentElement('credits')"
                  :aria-label="getCurrentElement('credits')"
                  fill="outline"
                  class="ion-margin-vertical"
                  :readonly="action == 'view' || approved.course"
                />
              </ion-col>
              <ion-col>
                <ion-input
                  type="number"
                  v-model="
                    castToCharacteristics1(
                      course_proposition[pages[current_page_index]]
                    ).up_hours
                  "
                  :label="getCurrentElement('up_hours')"
                  :aria-label="getCurrentElement('up_hours')"
                  fill="outline"
                  class="ion-margin-vertical"
                  :readonly="action == 'view' || approved.course"
                />
              </ion-col>
            </ion-row>
            <ion-row>
              <ion-col>
                <!-- Students per section constraints. -->
                <ionic-element
                  :element="
                    getCustomMessage(
                      'title',
                      getCurrentElement('students_per_section') + ':'
                    )
                  "
                />
                <ion-input
                  type="number"
                  v-model="
                    castToCharacteristics1(
                      course_proposition[pages[current_page_index]]
                    ).min_students
                  "
                  :label="getCurrentElement('min_students')"
                  :aria-label="getCurrentElement('min_students')"
                  fill="outline"
                  class="ion-margin-vertical"
                  :readonly="action == 'view' || approved.course"
                />
                <ion-input
                  type="number"
                  v-model="
                    castToCharacteristics1(
                      course_proposition[pages[current_page_index]]
                    ).max_students
                  "
                  :label="getCurrentElement('max_students')"
                  :aria-label="getCurrentElement('max_students')"
                  fill="outline"
                  class="ion-margin-vertical"
                  :readonly="action == 'view' || approved.course"
                />
              </ion-col>
              <ion-col>
                <custom-select
                  v-model:selected_option="
                    castToCharacteristics1(
                      course_proposition[pages[current_page_index]]
                    ).area_id
                  "
                  :list="learning_areas"
                  :label="getCurrentElement('learning_area') + ':'"
                  :aria_label="getCurrentElement('learning_area')"
                  :placeholder="getCurrentElement('area_choice')"
                  :getCompleteName="learningAreaToString"
                  :disabled="action == 'view' || approved.course"
                  :no_padding="true"
                />
              </ion-col>
            </ion-row>
          </template>

          <!-- Page: Characteristics #2 (teachings and growth areas selection + summary cards). -->
          <template v-else-if="pages[current_page_index] == 'characteristics2'">
            <ion-row>
              <!--<custom-select
                  v-model:selected_option="
                    castToCharacteristics2(
                      course_proposition[pages[current_page_index]]
                    ).growth_id
                  "
                  :list="growth_areas"
                  :label="getCurrentElement('growth_area') + ':'"
                  :aria_label="getCurrentElement('growth_area')"
                  :placeholder="getCurrentElement('growth_choice')"
                  :getCompleteName="growthAreaToString"
                  :disabled="action == 'view' || approved.course"
                />-->
              <ion-col
                v-for="key in Object.keys(course_proposition.characteristics2)"
                :key="key"
              >
                <!-- Select + cards list for either teachings or growth areas (depending on key). -->
                <ionic-element
                  :element="
                    getCustomMessage(
                      'title',
                      getCurrentElement(
                        key == 'teaching_list' ? 'teachings' : 'growth_areas'
                      )
                    )
                  "
                />
                <template
                  v-if="
                    action == 'propose' ||
                    (action == 'edit' && !approved.course)
                  "
                >
                  <!-- Input selector (enabled only in propose/edit when not approved). -->
                  <custom-select
                    v-if="key == 'teaching_list'"
                    :key="trigger + '_teachings_select'"
                    v-model:selected_option="selected_teaching"
                    :list="teachings.available"
                    :label="getCurrentElement('teaching') + ':'"
                    :aria_label="getCurrentElement('teaching')"
                    :placeholder="getCurrentElement('teaching_choices')"
                    :getCompleteName="getTitle"
                  />
                  <custom-select
                    v-else
                    :key="trigger + '_growth_areas_select'"
                    v-model:selected_option="selected_growth_area"
                    :list="growth_areas.available"
                    :label="getCurrentElement('growth_area') + ':'"
                    :aria_label="getCurrentElement('growth_area')"
                    :placeholder="getCurrentElement('growth_area_choices')"
                    :getCompleteName="getTitle"
                  />
                </template>
                <!-- List-card also acts as the remove action source via @signal_event. -->
                <list-card
                  :key="trigger + '_list'"
                  :cards_list="
                    key == 'teaching_list'
                      ? teachings_cards
                      : growth_areas_cards
                  "
                  :emptiness_message="
                    getCustomMessage(
                      'emptiness_message',
                      getCurrentElement(
                        key == 'teaching_list'
                          ? 'no_teachings'
                          : 'no_growth_areas'
                      )
                    )
                  "
                  @signal_event="
                    removeElement(
                      key == 'teaching_list' ? 'teachings' : 'growth_areas'
                    )
                  "
                />
              </ion-col>
            </ion-row>
          </template>

          <!-- Page: Access rules (who can subscribe based on context/address/year). -->
          <template v-else-if="pages[current_page_index] == 'access_object'">
            <ion-grid>
              <template
                v-if="
                  action == 'propose' || (action == 'edit' && !approved.course)
                "
              >
                <!-- Access rule builder: choose context + address + year and add to the list. -->
                <ion-row>
                  <ion-col>
                    <custom-select
                      v-model:selected_option="selected_learning_context"
                      :list="learning_contexts.available"
                      :label="getCurrentElement('learning_context') + ':'"
                      :aria_label="getCurrentElement('learning_context')"
                      :placeholder="
                        getCurrentElement('learning_context_choice')
                      "
                      :getCompleteName="learningContextToString"
                    />
                  </ion-col>
                  <ion-col>
                    <custom-select
                      :key="trigger + '_study_address'"
                      v-model:selected_option="selected_study_address"
                      :list="
                        study_addresses.available[selected_learning_context] ??
                        []
                      "
                      :label="getCurrentElement('study_address') + ':'"
                      :aria_label="getCurrentElement('study_address')"
                      :placeholder="
                        selected_learning_context != ''
                          ? getCurrentElement('study_address_choice')
                          : getCurrentElement('learning_context_needed')
                      "
                      :getCompleteName="studyAddressToString"
                    />
                    <!--<ion-checkbox
                      v-model="presidium"
                      :aria-label="getCurrentElement('presidium')"
                      class="ion-padding-start"
                      label-placement="start"
                      >{{ getCurrentElement("presidium") }}</ion-checkbox
                    >-->
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col>
                    <custom-select
                      :key="trigger + '_study_year'"
                      v-model:selected_option="selected_study_year"
                      :list="
                        study_years.available[selected_learning_context] !=
                        undefined
                          ? study_years.available[selected_learning_context][
                              selected_study_address
                            ] ?? []
                          : []
                      "
                      :label="getCurrentElement('study_year') + ':'"
                      :aria_label="getCurrentElement('study_year')"
                      :placeholder="
                        getCurrentElement(
                          selected_study_address != undefined
                            ? 'study_year_choice'
                            : 'study_address_needed'
                        )
                      "
                    />
                    <ion-checkbox
                      v-model="main_study_year"
                      :aria-label="getCurrentElement('main_study_year')"
                      class="ion-padding-start"
                      label-placement="start"
                      >{{ getCurrentElement("main_study_year") }}</ion-checkbox
                    >
                  </ion-col>
                </ion-row>
                <ion-row>
                  <ion-col>
                    <!-- Commit the currently selected access rule. -->
                    <ion-button
                      @click="addElement('access')"
                      expand="block"
                      fill="solid"
                    >
                      {{ getCurrentElement("add") }}
                    </ion-button>
                  </ion-col>
                </ion-row>
              </template>
              <ion-row>
                <ion-col>
                  <!-- Existing access propositions as cards. -->
                  <list-card
                    :key="trigger + '_list'"
                    :cards_list="access_propositions_cards"
                    :emptiness_message="
                      getCustomMessage(
                        'emptiness_message',
                        getCurrentElement('no_access_proposition')
                      )
                    "
                    @signal_event="removeElement('access')"
                  />
                </ion-col>
              </ion-row>
            </ion-grid>
          </template>

          <!-- Page: Images (carousel in view mode, uploader in propose/edit, reorder list when applicable). -->
          <template v-else-if="pages[current_page_index] == 'images_list'">
            <!--
            <ion-col v-if="grande && (no_reorder)" vuoto>
            <ion-col v-if="view">
              <carousel v-if="images != 0">
              <empty v-else>
            </ion-col>
            <ion-col v-else upload>
            <ion-col reorder v-if="images != 0 && view">
            -->
            <ion-grid>
              <ion-row>
                <ion-col
                  v-if="!(action != 'view' && images_list.length > 0)"
                  size="3"
                  class="ion-hide-md-down"
                ></ion-col>
                <ion-col
                  v-if="
                    action == 'view' ||
                    (action == 'edit' && user.type == 'admin')
                  "
                  size="12"
                  size-lg="6"
                  class="ion-text-center"
                >
                  <!-- Read-only visualization: carousel when images exist, placeholder otherwise. -->
                  <image-carousel
                    :key="carousel_trigger"
                    v-if="images_list.length > 0"
                    :images="images_list"
                    :show_name="!(action == 'view' && user.type == 'teacher')"
                  />
                  <ionic-element
                    v-else
                    :element="
                      getCustomMessage(
                        'no_uploaded_images',
                        getCurrentElement('no_uploaded_images'),
                        'string',
                        undefined,
                        {
                          label: {
                            'ion-padding-vertical': true,
                          },
                        }
                      )
                    "
                  />
                </ion-col>
                <ion-col v-else size="12" size-lg="6">
                  <!-- Upload UI used when editing/proposing (teachers cannot upload in view mode). -->
                  <image-uploader
                    v-model:images_list="images_list"
                    v-model:progress_infos="progress_infos"
                    @signal_event="setupModalAndOpen('error')"
                  />
                </ion-col>
                <ion-col
                  v-if="action != 'view' && images_list.length > 0"
                  size="12"
                  size-lg="6"
                >
                  <!-- Optional ordering UI (drag & drop) when images exist and editing is allowed. -->
                  <ionic-element
                    :element="
                      getCustomMessage(
                        'image_visualization_order',
                        getCurrentElement('image_visualization_order') + ':'
                      )
                    "
                  />
                  <ion-reorder-group
                    :disabled="approved.project_class || action == 'edit'"
                    @ionItemReorder="moveImage($event)"
                  >
                    <ion-item
                      v-for="(image, i) in images_list"
                      :key="'order_item_' + i"
                    >
                      <ionic-element
                        :element="getReorderLabel(i, image.name, false)"
                        @signal_event="removeImage()"
                      />
                      <ion-reorder slot="end" class="ion-no-margin" />
                    </ion-item>
                  </ion-reorder-group>
                </ion-col>
              </ion-row>
            </ion-grid>
          </template>

          <!-- Page: Project-class specific information + teachers list. -->
          <template
            v-else-if="pages[current_page_index] == 'specific_information'"
          >
            <ion-grid>
              <ion-row>
                <ion-col>
                  <!-- Project class metadata (session, group, section count, code). -->
                  <custom-select
                    v-model:selected_option="selected_session"
                    :list="learning_sessions"
                    :label="getCurrentElement('learning_sessions') + ':'"
                    :aria_label="getCurrentElement('learning_sessions')"
                    :placeholder="getCurrentElement('learning_sessions_choice')"
                    :getCompleteName="LearningSession.toString"
                    :disabled="action == 'view' || approved.project_class"
                  />
                  <custom-select
                    :key="trigger"
                    v-model:selected_option="
                      castToSpecificInformation(
                        course_proposition[pages[current_page_index]]
                      ).class_group
                    "
                    :list="groups"
                    :label="getCurrentElement('group') + ':'"
                    :aria_label="getCurrentElement('group')"
                    :placeholder="
                      getCurrentElement(
                        selected_session == -1
                          ? 'learning_session_needed'
                          : 'group_choice'
                      )
                    "
                    :disabled="action == 'view' || approved.project_class"
                  />
                  <div v-if="sections_use" class="ion-padding">
                    <ion-input
                      type="number"
                      v-model="num_section"
                      :label="getCurrentElement('num_section')"
                      :aria-label="getCurrentElement('num_section')"
                      fill="outline"
                      :readonly="action == 'view' || approved.project_class"
                    />
                  </div>
                  <div class="ion-padding">
                    <ion-input
                      type="text"
                      v-model="
                        castToSpecificInformation(
                          course_proposition[pages[current_page_index]]
                        ).project_class_code
                      "
                      :label="getCurrentElement('project_class_code')"
                      :aria-label="getCurrentElement('project_class_code')"
                      fill="outline"
                      :maxlength="
                        castAsArray(
                          ModelProposition.getRequiredInformation()
                            .project_class_code[0].rule
                        )[0]
                      "
                      :readonly="action == 'view' || approved.project_class"
                    />
                  </div>
                </ion-col>
                <ion-col>
                  <!-- Teachers proposition: selector + (optional) sections selection + cards list. -->
                  <ionic-element
                    :element="
                      getCustomMessage(
                        'teachers_title',
                        getCurrentElement('teachers')
                      )
                    "
                  />
                  <template v-if="action != 'view'">
                    <div>
                      <custom-select
                        :key="trigger + '_teacher'"
                        v-model:selected_option="selected_teacher"
                        :list="teachers.available"
                        :label="getCurrentElement('teacher') + ':'"
                        :aria_label="getCurrentElement('teacher')"
                        :placeholder="getCurrentElement('teacher_choice')"
                        :getCompleteName="teacherToString"
                      />
                      <!--<ionic-element
                        v-if="selected_teacher != 0"
                        :element="buttons[2]"
                        @signal_event="setupModalAndOpen('teacher_info')"
                      />-->
                      <!-- TODO (8): decommentare quando ci saranno le info dell'insegnante -->
                    </div>
                    <!--
                      <ion-checkbox
                        v-model="main_teacher"
                        :aria-label="getCurrentElement('main_teacher')"
                        class="ion-padding-start"
                        label-placement="start"
                        >{{ getCurrentElement("main_teacher") }}</ion-checkbox
                      >
                    -->
                    <template v-if="sections_use">
                      <ion-text class="ion-padding"
                        >{{ getCurrentElement("sections") }}:
                        {{
                          num_section == "" || parseInt(num_section) <= 0
                            ? getCurrentElement("num_section_needed")
                            : ""
                        }}</ion-text
                      >
                      <ion-list
                        v-if="num_section != '' && parseInt(num_section) > 0"
                      >
                        <ion-item
                          v-for="(value, index) in sections"
                          :key="numberToSection(index)"
                        >
                          <ion-checkbox
                            v-model="sections[index]"
                            :aria-label="numberToSection(index)"
                            class="ion-padding-start"
                            label-placement="start"
                            >{{ numberToSection(index) }}</ion-checkbox
                          >
                        </ion-item>
                      </ion-list>
                    </template>
                  </template>
                  <ion-button
                    v-if="sections_use && action == 'propose'"
                    @click="addElement('teachers')"
                    expand="block"
                    fill="solid"
                  >
                    {{ getCurrentElement("add") }}
                  </ion-button>
                  <!-- Proposed teachers as cards (also provides remove action source via @signal_event). -->
                  <list-card
                    :key="trigger + '_list'"
                    :cards_list="teachers_cards"
                    :emptiness_message="
                      getCustomMessage(
                        'emptiness_message',
                        getCurrentElement('no_teacher_proposition')
                      )
                    "
                    @signal_event="removeElement('teachers')"
                  />
                </ion-col>
              </ion-row>
            </ion-grid>
          </template>

          <!-- Footer: wizard navigation (previous/next). -->
          <ion-row
            class="ion-text-center"
            style="border-top: 1px solid var(--ion-color-dark)"
          >
            <ion-col>
              <ionic-element
                :element="buttons[0]"
                @signal_event="go(false)"
                :disabled="current_page_index == 0"
              />
            </ion-col>
            <ion-col>
              <ionic-element
                :element="buttons[1]"
                @signal_event="go(true)"
                :disabled="current_page_index == pages.length - 1"
              />
            </ion-col>
          </ion-row>
          <!--<template v-if="parameters_remaining">-->
          <ion-row>
            <ion-col>
              <!-- Final action: submit the proposition (available only in propose mode). -->
              <ion-button
                v-if="action == 'propose'"
                @click="checkAndConfirm"
                expand="block"
                fill="solid"
              >
                {{ getCurrentElement("propose") }}
              </ion-button>
              <!-- TODO (5): dopo aver creato il controllo reattivo su campi rimanenti modificare visualizzazione di "propose" rendendola reattiva -->
            </ion-col>
          </ion-row>
          <!--</template>-->
        </ion-grid>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script setup lang="ts">
/**
 * @displayName CourseProposition
 * @description
 * Multi-step UI to propose/view/edit a course model.
 * Uses rich-text editors for HTML fields, supports validation and an admin approval workflow.
 *
 * The component reacts to UI events stored in Vuex (`store.state.event`) and executes backend actions
 * via `executeLink`, depending on the current mode (propose/view/edit) and the user role.
 */

import {
  CourseModelProps,
  ModelProposition,
  User,
  LearningArea,
  CourseModel,
  GrowthArea,
  CustomElement,
  PropositionRequiredKeys,
  Teaching,
  StudyAddress,
  LearningSession,
  PropositionTitles,
  PropositionCharacteristics1,
  //PropositionCharacteristics2,
  OrderedCardsList,
  GeneralCardElements,
  TeachingProps,
  AccessProposition,
  LearningContext,
  Teacher,
  TeacherProps,
  TeacherProposition,
  PropositionDescription,
  PropositionExpectedLearningResults,
  PropositionActivities,
  PropositionCriterions,
  Course,
  AccessObject,
  PropositionTeacher,
  PropositionSpecificInformation,
  GrowthAreaProps,
  AlertInformation,
  AdminProjectClass,
  PropositionListsKeys,
  PropositionActions,
  ImageDescriptor,
} from "@/types";
import {
  executeLink,
  getAviableLanguages,
  getCurrentElement,
  getCurrentLanguage,
  getCustomMessage,
  getIcon,
  getLearningContexts,
  numberToSection,
  uploadMultipleImages,
} from "@/utils";
import {
  IonAlert,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonInput,
  IonButton,
  IonText,
  IonCheckbox,
  IonList,
  IonItem,
  IonReorderGroup,
  IonReorder,
} from "@ionic/vue";
import { reactive, ref, Ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";

type AvailableModal = "error" | "teacher_info" | "confirm" | "success";
type CardsListTypes = "access" | "teachers" | SimpleListTypes;
type SimpleListTypes = "growth_areas" | "teachings";
type SimpleList<T> = {
  available: T[];
  selected: T[];
};

/**
 * Convert a course model instance to its display string.
 * Used by selectors and UI bindings.
 */
const modelToString = (model: CourseModel) => model.toString();

/**
 * Convert a learning area to its localized title.
 */
const learningAreaToString = (learning_area: LearningArea) =>
  learning_area[`${language}_title`];
/*const growthAreaToString = (growth_area: GrowthArea) =>
  growth_area[`${language}_title`];*/

/**
 * Move the wizard forward/backward by one page.
 *
 * @param direction When true goes forward; when false goes backward.
 */
const go = (direction: boolean) => {
  if (direction && current_page_index.value < pages.length - 1) {
    current_page_index.value += 1;
  } else if (!direction && current_page_index.value > 0) {
    current_page_index.value -= 1;
  }
};

/**
 * Validate the proposition according to the current action and highlight the first missing field.
 *
 * Side effects:
 * - Opens an error modal with the first missing requirement.
 * - Navigates the wizard to the page that contains that requirement.
 *
 * @returns True when validation passes; false otherwise.
 */
const checkAndWarn = () => {
  const missing_information = course_proposition.check(action.value);
  const information_keys = Object.keys(
    missing_information
  ) as PropositionRequiredKeys[];

  let outcome = true;

  if (information_keys.length > 0) {
    setupModalAndOpen("error", missing_information[information_keys[0]]);
    current_page_index.value = course_proposition.getKeyIndex(
      information_keys[0]
    );
    //<!-- TODO (5): Cambiare colori a componenti per segnalare errori
    outcome = false;
  }

  return outcome;
};

/**
 * Validate the current proposition and, if valid, ask for confirmation.
 */
const checkAndConfirm = () => {
  if (checkAndWarn()) {
    setupModalAndOpen("confirm");
  }
};

/**
 * Send the proposition to the backend.
 *
 * On success, image uploads are performed (if any) and a success modal is shown.
 * On failure, an error modal is shown (including a specific message for duplicates).
 */
const propose = () => {
  executeLink(
    "/v1/propositions",
    (response) =>
      uploadImagesMessages(
        response.data.course_id,
        getCurrentElement("successful_proposal")
      )
        .then((message) =>
          setTimeout(() => setupModalAndOpen("success", message), 300)
        )
        .catch((message) =>
          setTimeout(() => setupModalAndOpen("error", message), 300)
        ),
    (error) => {
      if (error.response.status == 409) {
        setTimeout(
          () =>
            setupModalAndOpen("error", getCurrentElement("duplicate_course")),
          300
        );
      } else {
        setTimeout(() => setupModalAndOpen("error"), 300);
      }
    },
    "post",
    course_proposition.toProposition()
  );
};

/**
 * Close either the Ionic alert or the (currently disabled) additions modal.
 *
 * @param alert When true closes the alert; otherwise closes the additions modal.
 */
const closeModal = (alert: boolean) => {
  if (alert) {
    alert_open.value = false;
  } else {
    addition.value = false;
  }
};

/**
 * Configure the alert payload (title/message/buttons/inputs) and open it.
 *
 * @param window The kind of alert to show.
 * @param message Optional custom message.
 * @param approval When provided, turns the confirm window into approve/reject confirmation.
 */
const setupModalAndOpen = async (
  window: AvailableModal,
  message?: string,
  approval?: boolean
) => {
  alert_information.inputs = [];
  switch (window) {
    case "confirm":
      alert_information.title = "";
      alert_information.message = getCurrentElement(
        approval == undefined
          ? "proposition_confrimation"
          : approval
          ? "approval_confirmation"
          : "rejection_confirmation"
      );
      alert_information.buttons = [
        {
          text: getCurrentElement("yes"),
          role: "yes",
          handler: approval == undefined ? propose : () => approve(approval),
        },
        getCurrentElement("no"),
      ];
      if (approval == true) {
        alert_information.inputs = [
          {
            type: "checkbox",
            label: getCurrentElement("approve_project_class_too"),
            checked: true,
            handler: (input) => {
              approve_project_class = input.checked ?? true;
            },
          },
        ];
      }
      break;
    case "success":
      alert_information.title = "";
      alert_information.message =
        message ?? getCurrentElement("successful_operation");
      alert_information.buttons = [getCurrentElement("ok")];
      break;
    case "error":
      setAlertError(
        message ?? store.state.event.data?.message ?? getCurrentElement("error")
      );
      break;
  }
  alert_open.value = true;
};

/**
 * Helper to configure the alert as an error window.
 */
const setAlertError = (message: string | undefined) => {
  alert_information.title = getCurrentElement("error");
  alert_information.message = message ?? getCurrentElement("general_error");
  alert_information.buttons = [getCurrentElement("ok")];
};

/**
 * Best-effort localized title getter for objects that expose a `${language}_title` property.
 */
const getTitle = (obj: any) =>
  `${language}_title` in obj ? obj[`${language}_title`] : undefined;

const learningContextToString = (learning_context: LearningContext) =>
  learning_context[`${language}_title`];
const studyAddressToString = (study_address: StudyAddress) =>
  study_address[`${language}_title`];
const teacherToString = (teacher: Teacher) =>
  teacher.name + " " + teacher.surname;

/**
 * Narrow unknown objects to the proposition sub-shapes expected by the template bindings.
 * These casts are used to keep template code readable without changing runtime behavior.
 */
const castToTitles = (titles: any) => titles as PropositionTitles;
const castToCharacteristics1 = (characteristics: any) =>
  characteristics as PropositionCharacteristics1;
/*const castToCharacteristics2 = (characteristics: any) =>
  characteristics as PropositionCharacteristics2;*/
const castToDescription = (description: any) =>
  description as PropositionDescription;
const castToExpectedLearningResults = (expected_learning_results: any) =>
  expected_learning_results as PropositionExpectedLearningResults;
const castToCriterions = (criterions: any) =>
  criterions as PropositionCriterions;
const castToActivities = (activities: any) =>
  activities as PropositionActivities;
const castToSpecificInformation = (specific_information: any) =>
  specific_information as PropositionSpecificInformation;

/**
 * Add a Teaching/GrowthArea to the proposition lists and render its card.
 *
 * @param type Which list to update.
 * @param id Optional element id; defaults to the currently selected id.
 * @param only_card When true, only updates the UI cards (does not mutate proposition payload).
 * @param change_support_list When true, moves the element between available/selected lists.
 */
const addToSimpleList = (
  type: SimpleListTypes,
  id?: string | number,
  only_card = false,
  change_support_list = true
) => {
  let actual_id: string | number;
  let reference: SimpleList<Teaching | GrowthArea>;
  let cards_reference: OrderedCardsList<GeneralCardElements>;
  let tmp_index: number;
  let to_add: Teaching | GrowthArea;

  if (type == "teachings") {
    actual_id = id ?? selected_teaching.value;
    reference = teachings;
    cards_reference = teachings_cards;
  } else {
    actual_id = id ?? selected_growth_area.value;
    reference = growth_areas;
    cards_reference = growth_areas_cards;
  }

  const support_list = change_support_list
    ? reference.available
    : reference.selected;

  if (
    actual_id != (type == "teachings" ? "" : 0) &&
    (tmp_index = support_list.findIndex((a) => a.id == actual_id)) != -1
  ) {
    to_add = support_list[tmp_index];
    cards_reference.cards[""].push(to_add.toCard(action.value == "view"));

    if (type == "teachings") {
      if (!only_card) {
        course_proposition.characteristics2.teaching_list.push(
          to_add.id as string
        );
      }
      if (change_support_list) {
        teachings.selected.push(to_add as Teaching);
        teachings.available.splice(tmp_index, 1);
      }
      if (id == undefined) {
        selected_teaching.value = "";
      }
    } else {
      if (!only_card) {
        course_proposition.characteristics2.growth_list.push(
          to_add.id as number
        );
      }
      if (change_support_list) {
        growth_areas.selected.push(to_add as GrowthArea);
        growth_areas.available.splice(tmp_index, 1);
      }
      if (id == undefined) {
        selected_growth_area.value = 0;
      }
    }

    trigger.value++;
  }
};

/**
 * Add an access rule to the proposition (learning context + study address + year).
 *
 * @param learning_context_id Optional learning context id; defaults to the currently selected one.
 * @param access_object Optional explicit payload source (used when rebuilding cards from existing data).
 * @param only_card When true, only updates the UI cards (does not mutate proposition payload).
 * @param change_support_list When true, moves the element between available/selected lists.
 */
const addAccess = (
  learning_context_id?: string,
  access_object?: AccessObject,
  only_card = false,
  change_support_list = true
) => {
  const actual_learning_context_id =
    learning_context_id ?? selected_learning_context.value;
  let actual_study_address_id: string;
  let actual_study_year: number;
  let actual_presidium: boolean;
  let actual_main_study_year: boolean;

  let tmp_learning_context_index: number;
  let tmp_study_address_index: number;
  let tmp_study_year_index: number;
  let tmp_access_proposition: AccessProposition;
  let learning_context: LearningContext;
  let study_address: StudyAddress;
  let study_year: { id: number };

  if (access_object != undefined) {
    actual_study_address_id = access_object.study_address;
    actual_study_year = access_object.study_year;
    actual_presidium = access_object.presidium;
    actual_main_study_year = access_object.main_study_year;
  } else {
    actual_study_address_id = selected_study_address.value;
    actual_study_year = selected_study_year.value;
    actual_presidium = presidium.value;
    actual_main_study_year = main_study_year.value;
  }

  const support_context_list_index = change_support_list
    ? "available"
    : study_addresses.available[actual_learning_context_id] != undefined &&
      Object.keys(study_addresses.available[actual_learning_context_id])
        .length > 0
    ? "available"
    : "selected";
  const support_address_list_index = change_support_list
    ? "available"
    : support_context_list_index != "selected" &&
      study_years.available[actual_learning_context_id][
        actual_study_address_id
      ] != undefined &&
      Object.keys(
        study_years.available[actual_learning_context_id][
          actual_study_address_id
        ]
      ).length > 0
    ? "available"
    : "selected";
  const support_year_list_index = change_support_list
    ? "available"
    : "selected";

  if (
    actual_learning_context_id != "" &&
    (tmp_learning_context_index = learning_contexts[
      support_context_list_index
    ].findIndex((a) => a.id == actual_learning_context_id)) != -1 &&
    actual_study_address_id != "" &&
    (tmp_study_address_index = study_addresses[support_address_list_index][
      actual_learning_context_id
    ].findIndex((a) => a.id == actual_study_address_id)) != -1 &&
    actual_study_year != 0 &&
    (tmp_study_year_index = study_years[support_year_list_index][
      actual_learning_context_id
    ][actual_study_address_id].findIndex((a) => a.id == actual_study_year)) !=
      -1
  ) {
    learning_context =
      learning_contexts[support_context_list_index][tmp_learning_context_index];
    study_address =
      study_addresses[support_address_list_index][learning_context.id][
        tmp_study_address_index
      ];
    study_year =
      study_years[support_year_list_index][learning_context.id][
        study_address.id
      ][tmp_study_year_index];

    tmp_access_proposition = new AccessProposition(
      study_year.id,
      study_address,
      actual_presidium,
      actual_main_study_year
    );

    if (!only_card) {
      if (course_proposition.access_object[learning_context.id] == undefined) {
        course_proposition.access_object[learning_context.id] = [];
      }
      course_proposition.access_object[learning_context.id].push(
        tmp_access_proposition.toAccessObj()
      );
    }

    if (access_propositions_cards.cards[learning_context.id] == undefined) {
      access_propositions_cards.order.push({
        key: learning_context.id,
        title: getCustomMessage(
          "title",
          learning_context[`${language}_title`],
          "title"
        ),
      });
      access_propositions_cards.order.sort((a, b) =>
        a.key == b.key ? 0 : a.key > b.key ? 1 : -1
      );
      access_propositions_cards.cards[learning_context.id] = [];
    }
    access_propositions_cards.cards[learning_context.id].push(
      tmp_access_proposition.toCard(
        actual_learning_context_id,
        action.value == "view"
      )
    );

    if (change_support_list) {
      if (study_years.selected[learning_context.id] == undefined) {
        study_years.selected[learning_context.id] = {};
      }
      if (
        study_years.selected[learning_context.id][study_address.id] == undefined
      ) {
        study_years.selected[learning_context.id][study_address.id] = [];
      }
      study_years.selected[learning_context.id][study_address.id].push(
        study_year
      );
      study_years.available[learning_context.id][study_address.id].splice(
        tmp_study_year_index,
        1
      );
      if (access_object == undefined) {
        selected_study_year.value = 0;
      }

      if (
        study_years.available[learning_context.id][study_address.id].length == 0
      ) {
        if (study_addresses.selected[learning_context.id] == undefined) {
          study_addresses.selected[learning_context.id] = [];
        }
        study_addresses.selected[learning_context.id].push(study_address);
        study_addresses.available[learning_context.id].splice(
          tmp_study_address_index,
          1
        );
        if (access_object == undefined) {
          selected_study_address.value = "";
        }
      }
      if (study_addresses.available[learning_context.id].length == 0) {
        learning_contexts.selected.push(learning_context);
        learning_contexts.available.splice(tmp_learning_context_index, 1);
        if (learning_context == undefined) {
          selected_learning_context.value = "";
        }
      }

      if (access_object == undefined) {
        presidium.value = false;
        main_study_year.value = false;
      }
    }
  }
  trigger.value++;
};

/**
 * Add a teacher proposition (teacher + main flag + sections) and render its card.
 *
 * @param proposition_teacher Optional payload used when rebuilding cards from existing data.
 * @param only_card When true, only updates the UI cards (does not mutate proposition payload).
 * @param change_support_list When true, moves the teacher between available/selected lists.
 */
const addTeacher = (
  proposition_teacher?: PropositionTeacher,
  only_card = false,
  change_support_list = true
) => {
  let actual_teacher_id: number;
  let actual_main_teacher: boolean;
  let tmp_teacher_index: number;
  let teacher: Teacher;
  let teacher_proposition: TeacherProposition;

  if (proposition_teacher != undefined) {
    actual_teacher_id = proposition_teacher.teacher_id;
    actual_main_teacher = proposition_teacher.main;
  } else {
    actual_teacher_id = selected_teacher.value;
    actual_main_teacher = main_teacher.value;
  }

  const support_list = change_support_list
    ? teachers.available
    : teachers.selected;
  if (
    actual_teacher_id != 0 &&
    (tmp_teacher_index = support_list.findIndex(
      (a) => a.id == actual_teacher_id
    )) != -1 &&
    (proposition_teacher != undefined
      ? proposition_teacher.sections.length > 0
      : sections.find((a) => a))
  ) {
    teacher = support_list[tmp_teacher_index];
    teacher_proposition = new TeacherProposition(
      teacher,
      actual_main_teacher,
      sections
    );

    if (!only_card) {
      course_proposition.specific_information.teacher_list.push(
        teacher_proposition.toTeacherObj()
      );
    }

    teachers_cards.cards[""].push(
      teacher_proposition.toCard(action.value == "view")
    );

    if (change_support_list) {
      teachers.selected.push(teacher);
      teachers.available.splice(tmp_teacher_index, 1);
    }
    if (proposition_teacher == undefined) {
      selected_teacher.value = 0;
      main_teacher.value = false;
      for (const i in sections) {
        sections[i] = false;
      }
      sections[0] = true;
    }
  }
  trigger.value++;
};

/**
 * Generic "add" dispatcher used by template buttons.
 * Routes to the correct add helper depending on the current cards list type.
 */
const addElement = (type: CardsListTypes) => {
  switch (type) {
    case "teachings":
      addToSimpleList("teachings");
      break;
    case "growth_areas":
      addToSimpleList("growth_areas");
      break;
    case "access":
      addAccess();
      break;
    case "teachers":
      addTeacher();
      break;
  }
};

/**
 * Remove a selected teaching or growth area.
 * The element id is provided through the shared Vuex event payload.
 */
const removeSimpleElement = (type: SimpleListTypes) => {
  let reference: SimpleList<Teaching | GrowthArea>;
  let cards_reference: OrderedCardsList<GeneralCardElements>;

  if (type == "teachings") {
    reference = teachings;
    cards_reference = teachings_cards;
  } else {
    reference = growth_areas;
    cards_reference = growth_areas_cards;
  }

  const id: string | number = store.state.event.data.id;
  const tmp_index: number = reference.selected.findIndex((a) => a.id == id);

  if (type == "teachings") {
    course_proposition.characteristics2.teaching_list.splice(
      course_proposition.characteristics2.teaching_list.indexOf(id as string),
      1
    );
  } else {
    course_proposition.characteristics2.growth_list.splice(
      course_proposition.characteristics2.growth_list.indexOf(id as number),
      1
    );
  }

  cards_reference.cards[""].splice(
    cards_reference.cards[""].findIndex((a) => a.id == id),
    1
  );

  reference.available.push(reference.selected[tmp_index]);
  reference.available.sort((a, b) => (a.id == b.id ? 0 : a.id > b.id ? 1 : -1));
  reference.selected.splice(tmp_index, 1);
};

/**
 * Remove an element from one of the proposition card lists (teachings, growth areas, access rules, teachers).
 * Uses Vuex event payload data to identify which element to remove.
 */
const removeElement = (type: CardsListTypes) => {
  let learning_context_id: string;
  let study_address_id: string;
  let study_year: number;
  let access_id: string;
  let tmp_learning_context_index: number;
  let tmp_study_address_index: number;
  let tmp_study_year_index: number;

  let teacher_id: number;
  let tmp_teacher_index: number;

  switch (type) {
    case "teachings":
      removeSimpleElement("teachings");
      break;
    case "growth_areas":
      removeSimpleElement("growth_areas");
      break;
    case "access":
      learning_context_id = store.state.event.data.learning_context_id;
      study_address_id = store.state.event.data.study_address_id;
      study_year = store.state.event.data.study_year;
      access_id =
        learning_context_id + "_" + study_address_id + "_" + study_year;

      tmp_learning_context_index = learning_contexts.selected.findIndex(
        (a) => a.id == learning_context_id
      );
      tmp_study_address_index =
        study_addresses.selected[learning_context_id] != undefined
          ? study_addresses.selected[learning_context_id].findIndex(
              (a) => a.id == study_address_id
            )
          : -1;
      tmp_study_year_index = study_years.selected[learning_context_id][
        study_address_id
      ].findIndex((a) => a.id == study_year);

      course_proposition.access_object[learning_context_id].splice(
        course_proposition.access_object[learning_context_id].findIndex(
          (a) =>
            a.study_address == study_address_id && a.study_year == study_year
        ),
        1
      );

      access_propositions_cards.cards[learning_context_id].splice(
        access_propositions_cards.cards[learning_context_id].findIndex(
          (a) => a.id == access_id
        ),
        1
      );
      if (access_propositions_cards.cards[learning_context_id].length == 0) {
        access_propositions_cards.order.splice(
          access_propositions_cards.order.findIndex(
            (a) => a.key == learning_context_id
          ),
          1
        );
        delete access_propositions_cards.cards[learning_context_id];
      }

      study_years.available[learning_context_id][study_address_id].push(
        study_years.selected[learning_context_id][study_address_id][
          tmp_study_year_index
        ]
      );
      study_years.available[learning_context_id][study_address_id].sort(
        (a, b) => (a.id == b.id ? 0 : a.id > b.id ? 1 : -1)
      );
      study_years.selected[learning_context_id][study_address_id].splice(
        tmp_study_year_index,
        1
      );
      if (
        tmp_study_address_index != -1 &&
        study_years.available[learning_context_id][study_address_id].length > 0
      ) {
        study_addresses.selected[learning_context_id].push(
          study_addresses.available[learning_context_id][0]
        );
        study_addresses.available[learning_context_id].sort((a, b) =>
          a.id == b.id ? 0 : a.id > b.id ? 1 : -1
        );
        study_addresses.available[learning_context_id].splice(0, 1);
      }
      if (
        tmp_learning_context_index != -1 &&
        study_addresses.available[learning_context_id].length > 0
      ) {
        learning_contexts.selected.push(learning_contexts.available[0]);
        learning_contexts.available.sort((a, b) =>
          a.id == b.id ? 0 : a.id > b.id ? 1 : -1
        );
        learning_contexts.available.splice(0, 1);
      }
      break;
    case "teachers":
      teacher_id = store.state.event.data.id;
      tmp_teacher_index = teachers.selected.findIndex(
        (a) => a.id == teacher_id
      );

      course_proposition.specific_information.teacher_list.splice(
        course_proposition.specific_information.teacher_list.findIndex(
          (a) => a.teacher_id == teacher_id
        ),
        1
      );
      teachers_cards.cards[""].splice(
        teachers_cards.cards[""].findIndex((a) => a.id == "" + teacher_id),
        1
      );

      teachers.available.push(teachers.selected[tmp_teacher_index]);
      teachers.available.sort((a, b) =>
        a.id == b.id ? 0 : a.id > b.id ? 1 : -1
      );
      teachers.selected.splice(tmp_teacher_index, 1);
      break;
  }
  trigger.value++;
};

/**
 * Load an existing course proposition from the backend (admin info) and populate local state.
 *
 * When a valid course id is provided, initializes `course_proposition`, approval flags, images,
 * and optionally project-class information for the selected learning session.
 */
const edit_course_proposition = async (course_id?: number) => {
  let course: Course;
  let learning_area: LearningArea;
  if (course_id != undefined && !Number.isNaN(course_id)) {
    course = await Course.newCourse(
      "/v1/courses/" + course_id + "?admin_info=true"
    );
    approved.course = course.certifying_admin?.id != null;
    learning_area = await executeLink("/v1/learning_areas", (response) => {
      const tmp_area = response.data.data.find(
        (a: LearningArea) =>
          a.italian_title == course.italian_learning_area &&
          a.english_title == course.english_learning_area
      ); //<!-- TODO (8): aggiungere id in backend
      return tmp_area != undefined
        ? tmp_area
        : {
            id: -1,
            italian_title: "",
            english_title: "",
          };
    });
    images_list.value = course.images_list;
    old_images_names = course.images_list.map((a) => a.name);
    if (tmp_session_id != -1) {
      project_class = await executeLink(
        "/v1/project_classes/" + course_id + "/" + tmp_session_id,
        (response) => new AdminProjectClass(response.data.data)
      ); //<!-- TODO (4): aggiungere parametro num_section a quest'api e a quella generale
      approved.project_class = project_class.admin_id != undefined;
      tmp_teachers = await executeLink(
        "/v1/project_classes/" + course_id + "/" + tmp_session_id + "/teachers",
        (response) => {
          const teachers_summary: {
            [id: number]: PropositionTeacher;
          } = {};
          let tmp_id: number;

          for (const teacher_section of response.data.data) {
            tmp_id = teacher_section.teacher_ref.data.id;

            if (teachers_summary[tmp_id] == undefined) {
              teachers_summary[tmp_id] = {
                teacher_id: tmp_id,
                main: teacher_section.main_teacher === 1,
                sections: [],
              };
            }
            teachers_summary[tmp_id].sections.push(teacher_section.section);
          }

          return Object.values(teachers_summary);
        },
        () => []
      );
    }
    course_proposition = reactive(
      new ModelProposition({
        course_id: course_id,
        italian_title: course.italian_title,
        english_title: course.english_title,
        up_hours: course.up_hours,
        credits: course.credits,
        area_id: learning_area.id,
        growth_list: course.growth_list.map((a) => a.id),
        session_id: tmp_session_id,
        project_class_code: project_class?.project_class_code ?? "",
        class_group: project_class?.group ?? -1,
        num_section: 1,
        min_students: course.min_students,
        max_students: course.max_students,
        teaching_list: course.teaching_list.map((a) => a.id),
        italian_descr: course.italian_description,
        english_descr: course.english_description,
        italian_exp_l: course.italian_expected_learning_results,
        english_exp_l: course.english_expected_learning_results,
        italian_cri: course.italian_criterions,
        english_cri: course.english_criterions,
        italian_act: course.italian_activities,
        english_act: course.english_activities,
        access_object: course.access_object,
        images_list: images_list.value.filter((a) => a instanceof File),
        teacher_list: tmp_teachers,
      })
    );
    selected_session.value = tmp_session_id;
    fillCardsLists({});
  } else {
    course_proposition = reactive(new ModelProposition());
  }
  trigger.value++;
};

/**
 * Rebuild all cards lists (teachings/growth/access/teachers) from the current proposition payload.
 *
 * The optional `lists_info` object can clear cards/support lists and control whether the rebuild
 * should only update cards and/or move elements between available/selected lists.
 */
const fillCardsLists = (lists_info: {
  [key in keyof string as PropositionListsKeys]?: {
    clear?: {
      cards?: boolean;
      support_list?: boolean;
    };
    only_card?: boolean;
    change_support_list?: boolean;
  };
}) => {
  if (lists_info["teaching_list"]?.clear != undefined) {
    if (lists_info["teaching_list"]?.clear.cards == true) {
      teachings_cards.order = [];
      teachings_cards.cards = {
        "": [],
      };
    }
    if (lists_info["teaching_list"]?.clear.support_list == true) {
      teachings.available = [];
      teachings.selected = [];
    }
  }
  for (const teaching of course_proposition.characteristics2.teaching_list) {
    addToSimpleList(
      "teachings",
      teaching,
      lists_info["teaching_list"]?.only_card ?? true,
      lists_info["teaching_list"]?.change_support_list
    );
  }
  if (lists_info["growth_list"]?.clear != undefined) {
    if (lists_info["growth_list"]?.clear.cards == true) {
      growth_areas_cards.order = [];
      growth_areas_cards.cards = {
        "": [],
      };
    }
    if (lists_info["growth_list"]?.clear.support_list == true) {
      growth_areas.available = [];
      growth_areas.selected = [];
    }
  }
  for (const growth_area of course_proposition.characteristics2.growth_list) {
    addToSimpleList(
      "growth_areas",
      growth_area,
      lists_info["growth_list"]?.only_card ?? true,
      lists_info["growth_list"]?.change_support_list
    );
  }
  if (lists_info["access_object"]?.clear != undefined) {
    if (lists_info["access_object"]?.clear.cards == true) {
      access_propositions_cards.order = [];
      access_propositions_cards.cards = {};
    }
    if (lists_info["access_object"]?.clear.support_list == true) {
      course_proposition.access_object = {};
      learning_contexts.available = [];
      learning_contexts.selected = [];
      study_addresses.available = {};
      study_addresses.selected = {};
      study_years.available = {};
      study_years.selected = {};
    }
  }
  for (const learning_context_id in course_proposition.access_object) {
    for (const access_object of course_proposition.access_object[
      learning_context_id
    ]) {
      addAccess(
        learning_context_id,
        access_object,
        lists_info["access_object"]?.only_card ?? true,
        lists_info["access_object"]?.change_support_list
      );
    }
  }
  if (course_proposition.specific_information.session_id != undefined) {
    if (lists_info["teacher_list"]?.clear != undefined) {
      if (lists_info["teacher_list"]?.clear.cards == true) {
        teachers_cards.order = [];
        teachers_cards.cards = {
          "": [],
        };
      }
      if (lists_info["teacher_list"]?.clear.support_list == true) {
        teachers.available = [];
        teachers.selected = [];
      }
    }
    selected_session.value = course_proposition.specific_information.session_id;
    for (const teacher of course_proposition.specific_information
      .teacher_list) {
      addTeacher(
        teacher,
        lists_info["teacher_list"]?.only_card ?? true,
        lists_info["teacher_list"]?.change_support_list
      );
    }
  }
};

/**
 * Switch between proposition modalities (view/edit).
 *
 * When leaving edit mode, validates and persists changes before switching to view.
 * Cards lists are rebuilt according to approval status.
 */
const changeModality = (new_action: PropositionActions) => {
  const tmp_lists_info = {
    clear: {
      cards: true,
    },
    change_support_list: false,
  };
  const lists_info = {
    teaching_list: !approved.course ? tmp_lists_info : undefined,
    growth_list: !approved.course ? tmp_lists_info : undefined,
    access_object: !approved.course ? tmp_lists_info : undefined,
    teacher_list: tmp_lists_info,
  };

  //let changes_error = false;

  if (action.value == "edit" && new_action == "view") {
    if (checkAndWarn()) {
      executeLink(
        "/v1/courses/" + course_proposition.course_id,
        async () => {
          const remaining_old_images: ImageDescriptor[] =
            images_list.value.filter(
              (a) => !(a instanceof File)
            ) as ImageDescriptor[];

          /*let message = "";

          if (course_proposition.images_list.length > 0) {f
            message = await uploadImagesMessages(
              course_proposition.course_id,
              ""
            ).then(a => a).catch(a => a);
            if (message != "") {
              images_list.value = images_list.value.filter(
                (a) => !(a instanceof File)
              );
            }
          }*/
          if (
            //message == "" &&
            old_images_names.length > 0 &&
            remaining_old_images.length != old_images_names.length
          ) {
            if (remaining_old_images.length == 0) {
              executeLink(
                "/v1/images/course/" + course_proposition.course_id,
                undefined,
                () => getCurrentElement("images_upload_error"),
                "delete"
              );
            } else {
              for (const image_name of old_images_names.filter(
                (a) => remaining_old_images.findIndex((b) => a == b.name) == -1
              )) {
                executeLink(
                  "/v1/images/course/" +
                    course_proposition.course_id +
                    "?name=" +
                    image_name,
                  undefined,
                  () => getCurrentElement("images_upload_error"),
                  "delete"
                );
              }
            }
          } /*else if (message != "") {
            setupModalAndOpen("error", message);
          }*/
        },
        () => {
          //changes_error = true;
          setupModalAndOpen("error", getCurrentElement("changes_not_made"));
        },
        "put",
        course_proposition.toProposition()
      );
      action.value = new_action;
      fillCardsLists(lists_info);
    }
  } else if (action.value == "view" && new_action == "edit") {
    action.value = new_action;
    fillCardsLists(lists_info);
  }
  trigger.value++;
};

/**
 * Admin-only approval/rejection action for a proposition (and optionally its project class).
 *
 * @param outcome True to approve, false to reject.
 */
const approve = (outcome = true) => {
  if (course_proposition.specific_information.session_id != -1) {
    executeLink(
      "/v1/propositions/approval?course_id=" +
        course_proposition.course_id +
        "&session_id=" +
        course_proposition.specific_information.session_id +
        "&approved=" +
        outcome +
        (outcome ? "&proj_class=" + approve_project_class : ""),
      () => {
        approve_project_class = true;
        setTimeout(() => {
          setupModalAndOpen(
            "success",
            getCurrentElement(
              "successful_" + (outcome ? "confirmation" : "rejection")
            )
          );
          $router.push({ name: "propositions_history" });
        }, 300);
      },
      () => {
        approve_project_class = true;
        setTimeout(() => {
          setupModalAndOpen("error", getCurrentElement("general_error"));
        }, 300);
      },
      "put"
    );
  } else {
    approve_project_class = true;
    setTimeout(() => {
      setupModalAndOpen("error", getCurrentElement("general_error"));
    }, 300);
  }
};

/**
 * @returns True when both the course and the project class are approved.
 */
const allApproed = () => approved.course && approved.project_class;

/**
 * Handle Ionic reorder events for images.
 */
const moveImage = (event: CustomEvent) => {
  event.detail.complete(images_list.value);
};

/**
 * Remove one image from the list based on the Vuex event payload and refresh the carousel.
 */
const removeImage = () => {
  const image_index = images_list.value.findIndex(
    (a) => a.name == store.state.event.data.name
  );

  if (image_index != -1) {
    images_list.value.splice(image_index, 1);
    carousel_trigger.value++;
  }
};

/**
 * Upload pending images (if any) and return a message to be shown in the UI.
 *
 * Resolves with `successful_message` when upload succeeded or there is nothing to upload.
 * Rejects with a composed error message when upload fails.
 */
const uploadImagesMessages = async (
  refer_course_id: number | undefined,
  successful_message: string
) => {
  let status = undefined;

  if (course_proposition.images_list.length > 0) {
    status = await uploadMultipleImages(
      "/v1/images/course/" + refer_course_id,
      course_proposition.images_list
    )
      .then((a) => a)
      .catch((a) => a);
  }

  return new Promise<string>((resolve, reject) =>
    status == undefined || status == 201
      ? resolve(successful_message)
      : reject(
          (successful_message != "" ? successful_message + ". " : "") +
            (status == 400
              ? getCurrentElement("images_upload_error")
              : status == 401
              ? getCurrentElement("unauthorized_image_uploading")
              : getCurrentElement("error"))
        )
  );
};

/**
 * Build a reorder-list row label for an image.
 * When `disabled` is false, includes a remove icon that triggers the corresponding event.
 */
const getReorderLabel = (index: number, name: string, disabled: boolean) => {
  const to_ret: CustomElement = {
    id: "image_" + index,
    type: "string",
    content: name,
    classes: {
      item: {
        w_100: true,
      },
    },
  };

  if (!disabled) {
    Object.assign(to_ret, {
      type: "string_icon",
      linkType: "event",
      content: {
        text: name,
        icon: getIcon("close"),
        event: "remove",
        data: {
          name: name,
        },
      },
    });
  }

  return to_ret;
};

/**
 * Cast a value to an array when the type system cannot infer it from runtime data.
 */
const castAsArray = (e: any) => e as Array<any>;
/*const parameters_remaining = computed(
  () => course_proposition.remaining.length == 0
);*/

const store = useStore();
const user = User.getLoggedUser() as User;
const language = getCurrentLanguage();
const languages = getAviableLanguages();
const $route = useRoute();
const $router = useRouter();
const alert_information: AlertInformation = store.state.alert_information;

const trigger = ref(0);
const carousel_trigger = ref(0);
const alert_open = ref(false);
const pages = ModelProposition.getProps("pages");
const current_page_index = ref(0);
const button_css = Object.assign(
  JSON.parse(JSON.stringify(store.state.button_css)),
  {
    classes: {
      button: {
        radius: true,
        "ion-margin-start": {
          general: true,
          sm: false,
        },
      },
    },
  }
);
const buttons: CustomElement[] = [
  {
    id: "back",
    type: "icon",
    linkType: "event",
    content: {
      event: "back",
      icon: getIcon("arrow_back"),
    },
  },
  {
    id: "next",
    type: "icon",
    linkType: "event",
    content: {
      event: "next",
      icon: getIcon("arrow_forward"),
    },
  },
  {
    id: "teacher_info",
    type: "icon",
    linkType: "event",
    content: {
      event: "teacher_info",
      icon: getIcon("information_circle"),
    },
  },
  {
    id: "history",
    type: "string_icon",
    linkType: "request",
    content: {
      url: "/propositions_history",
      method: "get",
      icon: getIcon("archive"),
      text: getCurrentElement("history"),
      whole_link: true,
    },
    ...button_css,
  },
  {
    id: "approve",
    type: "string_icon",
    linkType: "event",
    content: {
      event: "approve",
      icon: getIcon("checkmark"),
      text: getCurrentElement("approve"),
      whole_link: true,
    },
    ...button_css,
  },
  {
    id: "reject",
    type: "string_icon",
    linkType: "event",
    content: {
      event: "reject",
      icon: getIcon("close"),
      text: getCurrentElement("reject"),
      whole_link: true,
    },
    ...button_css,
  },
  {
    id: "edit",
    type: "string_icon",
    linkType: "event",
    content: {
      event: "edit",
      icon: getIcon("pencil"),
      text: getCurrentElement("edit"),
      whole_link: true,
    },
    ...button_css,
  },
  {
    id: "view",
    type: "string_icon",
    linkType: "event",
    content: {
      event: "view",
      icon: getIcon("eye"),
      text: getCurrentElement("view"),
      whole_link: true,
    },
    ...button_css,
  },
];
const selected_session = ref(-1);
const addition = ref(false);
const presidium = ref(false);
const main_study_year = ref(false);
const selected_teaching = ref("");
const selected_growth_area = ref(0);
const tmp_set: Set<number> = new Set();
const selected_learning_context = ref("");
const selected_study_address = ref("");
const selected_study_year = ref(0);
const teachings_cards: OrderedCardsList<GeneralCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};
const teachings: SimpleList<Teaching> = {
  available: [],
  selected: [],
};
const growth_areas_cards: OrderedCardsList<GeneralCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};
const growth_areas: SimpleList<GrowthArea> = {
  available: [],
  selected: [],
};
const access_propositions_cards: OrderedCardsList<GeneralCardElements> = {
  order: [],
  cards: {},
};
const learning_contexts: {
  available: LearningContext[];
  selected: LearningContext[];
} = {
  available: [],
  selected: [],
};
const study_addresses: {
  available: {
    [key: string]: StudyAddress[];
  };
  selected: {
    [key: string]: StudyAddress[];
  };
} = {
  available: {},
  selected: {},
};
const study_years: {
  //<!-- TODO (5): cambiare da lista (attuale) a checkbox. Rispettivamente usare card per ogni study_address e checkbox per ogni classe al suo interno
  available: {
    [key: string]: {
      [key: string]: { id: number }[];
    };
  };
  selected: {
    [key: string]: {
      [key: string]: { id: number }[];
    };
  };
} = {
  available: {},
  selected: {},
};
const selected_teacher = ref(0);
const teachers: {
  available: Teacher[];
  selected: Teacher[];
} = {
  available: [],
  selected: [],
};
const num_section: Ref<string> = ref("1"); //<!-- TODO (10): bug di ion-input che da stringa anche con type="number"
const main_teacher = ref(false);
const teachers_cards: OrderedCardsList<GeneralCardElements> = {
  order: [],
  cards: {
    "": [],
  },
};
const action: Ref<PropositionActions> = ref(
  $route.query.view != undefined ? "view" : "propose"
);
const tmp_project_class_id =
  $route.query[action.value] != undefined
    ? ($route.query[action.value] as string).split("_")
    : [];
const selected_model: Ref<number | undefined> = ref(
  tmp_project_class_id.length > 0
    ? parseInt(tmp_project_class_id[0])
    : undefined
);
const tmp_session_id =
  tmp_project_class_id.length > 1 ? parseInt(tmp_project_class_id[1]) : -1;
const approved: {
  course: boolean;
  project_class: boolean;
} = {
  course: false,
  project_class: false,
};
const sections_use: boolean = store.state.sections_use;
const images_list: Ref<(ImageDescriptor | File)[]> = ref([]);
const progress_infos: Ref<
  {
    percentage: number;
  }[]
> = ref([]);
/*const correspondences: {
  [key in keyof string as ListTypes]: {
    [key: string]: string
  }
} = {
  teachings: {
    list
  },
  access: {

  },
  teachers: {

  }
}*/

let course_proposition = reactive(new ModelProposition());
let models: CourseModel[] = [];
let learning_areas: LearningArea[] = [];
let learning_sessions: LearningSession[] = [];
let groups: { id: number }[] = [];
let sections: boolean[] = reactive([true]);
let project_class: AdminProjectClass;
let tmp_teachers: PropositionTeacher[] = [];
let approve_project_class = true;
let old_images_names: string[] = [];

models = await executeLink(
  "/v1/propositions?recent_models=true", //<!-- TODO (5): fare rework recent_models (mettere filtro su tutti i corsi)
  (response) =>
    response.data.data.map((a: CourseModelProps) => new CourseModel(a)),
  () => []
);
learning_areas = await executeLink(
  "/v1/learning_areas?all_data=true",
  (response) => response.data.data,
  () => []
);
growth_areas.available = await executeLink(
  "/v1/growth_areas",
  (response) =>
    response.data.data.map((a: GrowthAreaProps) => new GrowthArea(a)),
  () => []
);
learning_sessions = await executeLink(
  "/v1/learning_sessions?" +
    (action.value != "view" ? "future_session=true" : ""), //<!-- TODO (6): aggiungere course_id quando disponibile per questa api
  (response) => {
    const tmp_learning_sessions: LearningSession[] = [];

    let tmp_session: LearningSession;

    for (const session of response.data.data) {
      tmp_session = new LearningSession(session);
      tmp_set.add(tmp_session.school_year);
      tmp_learning_sessions.push(tmp_session);
    }

    return tmp_learning_sessions;
  },
  () => []
);
teachings.available = await executeLink(
  "/v1/teachings?all_data=true",
  (response) => response.data.data.map((a: TeachingProps) => new Teaching(a)),
  () => []
);

learning_contexts.available = await getLearningContexts(user);
await executeLink(
  "/v1/study_addresses",
  (response) => {
    for (const context of learning_contexts.available) {
      study_addresses.available[context.id] = [];
      study_years.available[context.id] = {};
      for (const address of response.data.data) {
        study_addresses.available[context.id].push(address);
        study_years.available[context.id][address.id] = Array.from(
          { length: address.max_classes },
          (value, index) => {
            return {
              id: index + 1,
            };
          }
        );
      }
    }
  },
  () => []
);
teachers.available = await executeLink(
  "/v1/teachers",
  (response) => response.data.data.map((a: TeacherProps) => new Teacher(a)),
  () => []
);

watch(selected_session, (new_session) => {
  const tmp_learning_session = learning_sessions.find(
    (a) => a.id == new_session
  );

  course_proposition.specific_information.session_id = new_session;
  groups = Array.from(
    {
      length:
        tmp_learning_session != undefined ? tmp_learning_session.num_groups : 0,
    },
    (_, i) => {
      return {
        id: i + 1,
      };
    }
  );
  trigger.value++;
});
watch(selected_learning_context, (new_learning_context) => {
  if (
    new_learning_context != undefined &&
    study_addresses.available[new_learning_context] != undefined &&
    study_addresses.available[new_learning_context].findIndex(
      (a) => a.id == selected_study_address.value
    ) == -1
  ) {
    selected_study_address.value = "";
  }
  trigger.value++;
});
watch(selected_study_address, (new_study_address) => {
  let tmp_study_address;

  if (
    new_study_address != "" &&
    (tmp_study_address = study_addresses.available[
      selected_learning_context.value
    ].find((a) => a.id == new_study_address)) != undefined &&
    selected_study_year.value > tmp_study_address.max_classes
  ) {
    selected_study_year.value = 0;
  }
  trigger.value++;
});
watch(num_section, (n, o) => {
  const actual_n = n != "" ? parseInt(n) : 0;

  course_proposition.specific_information.num_section = actual_n;
  if (actual_n > 0) {
    course_proposition.specific_information.num_section = actual_n;
    if (sections.length > actual_n) {
      sections.splice(actual_n);
    } else if (sections.length < actual_n) {
      sections = reactive(
        sections.concat(new Array(actual_n - sections.length).fill(false))
      );
      if (sections.length > 0) {
        sections[0] = true;
      }
    }
  } else {
    num_section.value = o;
  }
});
if (selected_model.value != undefined) {
  edit_course_proposition(selected_model.value);
}
watch(selected_model, () => {
  if (selected_model.value != undefined) {
    edit_course_proposition(selected_model.value);
  }
  trigger.value++;
});
watch(selected_teaching, () => {
  addElement("teachings");
});
watch(selected_growth_area, () => {
  addElement("growth_areas");
});
if (!sections_use) {
  watch(selected_teacher, (n) => {
    if (n != 0) {
      addElement("teachers");
    }
  });
}
watch(
  () => images_list.value,
  (value) => {
    course_proposition.images_list = value.filter((a) => a instanceof File);
  }
);
</script>

<style scoped>
ion-card-header {
  --background: rgba(var(--ion-color-black-rgb), 0.25);
}
ion-button {
  --background: rgba(var(--ion-color-black-rgb), 0.25);
}
</style>
