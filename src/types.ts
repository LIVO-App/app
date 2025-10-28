import { Method } from "axios";
import { store } from "./store";
import { AlertButton, AlertInput } from "@ionic/vue";
import {
  dateStringToDate,
  executeLink,
  getActualLearningContext,
  getCardValues,
  getCompleteSchoolYear,
  getCssColor,
  getCurrentElement,
  getCurrentLanguage,
  getCurrentSchoolYear,
  getCustomMessage,
  getDateStringToSend,
  getGender,
  getIcon,
  getRagneString,
  getStatusColor,
  getStatusString,
  getStudyAddressVisualization,
  getSubscribedCredits,
  isLinkedToAreas,
  isSmaller,
  numberToSection,
  toDateString,
} from "./utils";

type Language = "italian" | "english";

type MenuItem = {
  url_names: {
    [key in keyof string as UserType]: string[];
  };
  icon_ref: string;
  additional_controls?: {
    [key in keyof string as UserType]: () => boolean;
  };
};

type Menu = {
  items: {
    [key: string]: MenuItem;
  };
  order: {
    [key in keyof string as UserType]: string[];
  };
  default_item: {
    [key in keyof string as UserType]: string;
  };
  index: number;
};

type BaseElement = {
  [key: string]: string; // TODO (9): mettere [key in keyof string as Language]
};

type ElementsList = {
  [key in keyof string as Language]: {
    [key: string]: string;
  };
};

type ResponseItem<T> = {
  path: string;
  single: boolean;
  query: {
    [key: string]: string;
  };
  data: T | T[];
};

type AnnualCredits = {
  study_year: number;
  study_address: string;
  definition_year: number;
};

type OrdinaryClassSummaryProps = {
  study_year: number;
  address: string;
  section: string;
  school_year?: number;
};

class OrdinaryClassSummary {
  study_year: number;
  address: string;
  section?: string;
  school_year: number;

  constructor(classObj: OrdinaryClassSummaryProps) {
    this.study_year = classObj.study_year;
    this.address = classObj.address;
    this.section = classObj.section;
    this.school_year = classObj.school_year ?? getCurrentSchoolYear();
  }

  toString(section = true, school_year = false) {
    return (
      this.study_year +
      " " +
      this.address +
      (store.state.sections_use && section ? " " + this.section : "") +
      (school_year ? " " + this.school_year : "")
    );
  }

  toCard(
    section = true,
    school_year = false,
    selected = false
  ): GeneralCardElements {
    const id = this.toString(section, school_year);
    return {
      id: id,
      group: this.school_year,
      title: getCustomMessage(
        "title",
        this.toString(section, school_year),
        "title"
      ),
      selected: selected,
      link: {
        event: "change_selection",
        data: {
          id: id,
        },
      },
    };
  }
}

type OrdinaryClassProps = {
  annual_credits_ref?: ResponseItem<AnnualCredits>;
  english_displayed_name: string; // TODO (8): sistemare visualizzazione nome classe
  italian_displayed_name: string;
  school_year: number;
  study_address_ref: ResponseItem<{
    id: string;
  }>;
  study_year_ref: ResponseItem<{
    id: number;
  }>;
};

class OrdinaryClass extends OrdinaryClassSummary {
  annual_credits?: AnnualCredits;
  english_displayed_name?: string; // TODO (8): sistemare visualizzazione nome classe
  italian_displayed_name?: string;

  constructor(classObj: OrdinaryClassProps, section?: string) {
    super({
      study_year: (classObj.study_year_ref.data as { id: number }).id,
      address: (classObj.study_address_ref.data as { id: string }).id,
      section: section ?? store.state.default_section,
      school_year: classObj.school_year,
    });
    this.annual_credits =
      classObj.annual_credits_ref != undefined
        ? (classObj.annual_credits_ref.data as AnnualCredits)
        : undefined;
    this.english_displayed_name = classObj.english_displayed_name;
    this.italian_displayed_name = classObj.italian_displayed_name;
  }

  toOrdinaryClassSummary(): OrdinaryClassSummary {
    return new OrdinaryClassSummary({
      study_year: this.study_year,
      address: this.address,
      section: this.section ?? store.state.default_section,
      school_year: this.school_year,
    });
  }

  toString(section = true, school_year = false, divider = " ") {
    return (
      this.study_year +
      divider +
      this.address +
      (store.state.sections_use && section ? divider + this.section : "") +
      (school_year ? divider + this.school_year : "")
    );
  }

  toCard(
    section = true,
    school_year = false,
    selected = false,
    path?: string
  ): GeneralCardElements {
    const id = this.toString(section, school_year);
    const study_address_visualization = getStudyAddressVisualization(
      this.address
    );

    return {
      id: id,
      group: this.school_year,
      title: getCustomMessage(
        "title",
        this.study_year,
        "title",
        {
          text: {
            name: "white",
            type: "var",
          },
          background:
            study_address_visualization != undefined
              ? study_address_visualization.background
              : {
                  name: "medium",
                  type: "var",
                },
        },
        {
          label: {
            "ion-padding": true,
            radius: true,
          },
        }
      ), // ! (3): mettere in content e adattare
      selected: selected,
      link:
        path != undefined
          ? {
              url: path,
              method: "get",
            }
          : {
              event: "change_selection",
              data: {
                id: id,
              },
            },
      classes: {
        content: {
          "ion-no-padding": true,
        },
      },
    };
  }
}

class Enrollment {
  private _enrollment: boolean | Date;
  private _editable: boolean;
  constructor(
    pending: boolean | Date,
    learning_session: LearningSession,
    reference = new Date(),
    open_enrollment = false
  ) {
    this._enrollment = !(pending instanceof Date && isNaN(pending.getTime()))
      ? pending
      : false;
    this._editable =
      learning_session.getStatus(reference) == LearningSessionStatus.FUTURE &&
      open_enrollment;
  }
  get enrollment(): Date | boolean {
    return this._enrollment;
  }
  set enrollment(enrollment: Date | boolean) {
    if (!(enrollment instanceof Date && isNaN(enrollment.getTime()))) {
      this._enrollment = enrollment;
    } // TODO (9): pensare se mettere "else false" (sfruttabile per perdita di dati)
  }
  get editable(): boolean {
    return this._editable;
  }
  set editable(editable: boolean) {
    this._editable = editable;
  }
  isPending(): boolean {
    return this.enrollment instanceof Date;
  }
  getChangingMethod(): Method {
    return this.enrollment ? "delete" : "post";
  }
  getEnrollmentIcon(path: string, method?: Method): RequestIcon {
    return {
      url: path,
      method: this.editable
        ? method ?? this.getChangingMethod()
        : method ?? "get",
      icon: this.enrollment === false ? getIcon("add") : getIcon("close"),
    };
  }
  getStatusColors(): Colors<CustomSubElements> {
    return {
      text: {
        name: this.isPending()
          ? "medium"
          : this.enrollment === true
          ? "success"
          : "danger",
        type: "var",
      },
      background: !this.isPending()
        ? {
            name: this.enrollment === true ? "light_success" : "light_danger",
            type: "var",
          }
        : undefined,
    };
  }
  getChangeButtonColors(): Colors<CustomSubElements> {
    return {
      text:
        this.enrollment === false
          ? {
              name: "white",
              type: "var",
            }
          : undefined,
      background:
        this.enrollment === false
          ? {
              name: "light",
              type: "var",
            }
          : undefined,
      borders:
        this.enrollment !== false
          ? {
              name: "light",
              type: "var",
            }
          : undefined,
    };
  }
  toString(): string {
    return this.isPending()
      ? getCurrentElement(
          store.state.static_subscription ? "fully_booked" : "pending"
        )
      : this.enrollment === true
      ? getCurrentElement("enrolled")
      : getCurrentElement("not_enrolled");
  }
}

type CardElements = {
  id: string;
  group: any;
  colors?: Colors<CustomSubElements>;
  classes?: Classes<CardSubElements>;
  hovered?: boolean;
};

type OptionalCardElements = {
  title?: CustomElement;
  subtitle?: CustomElement;
  side_element?: CustomElement;
  selected?: boolean;
  link?: LinkParameters;
};

type LayoutElement = {
  id: string | number;
  size?: string | BreakpointVisibility<Breakpoint, string>;
};

type Layout = BreakpointVisibility<
  Breakpoint,
  (string | number)[] | LayoutElement[][]
>;

type OptionalContentCard = {
  content?: CustomElement[];
};

type LinkedLayout = {
  layout?: Layout;
  linked_elements?: TmpList<(string | number)[]>;
};

type GeneralCardElements = CardElements &
  OptionalCardElements &
  OptionalContentCard &
  LinkedLayout;

type GeneralTableCardElements = CardElements &
  OptionalCardElements &
  Required<OptionalContentCard> &
  LinkedLayout;

type EnrollmentCardElements = CardElements &
  Required<OptionalContentCard> &
  LinkedLayout & {
    credits: number;
    enrollment: Enrollment;
  };

enum LearningSessionStatus {
  FUTURE,
  UPCOMING,
  CURRENT,
  COMPLETED,
}

type LearningArea = {
  id: string;
  credits?: number;
} & {
  [key in keyof string as `${Language}_title`]: string;
} & {
  [key in keyof string as `${Language}_description`]: string | null;
};

type MinimumCourseProps = {
  id: number;
  section: string;
} & {
  [key in keyof string as `${Language}_title`]: string;
};

class MinimizedCourse implements MinimumCourseProps {
  id: number;
  section: string;
  italian_title: string;
  english_title: string;

  constructor(course: MinimumCourseProps) {
    this.id = course.id;
    this.section = course.section;
    this.italian_title = course.italian_title;
    this.english_title = course.english_title;
  }

  toCard(path?: string): GeneralCardElements {
    const language = getCurrentLanguage();
    const card: GeneralCardElements = {
      id: "" + this.id + "_" + this.section,
      group: "",
      content: [
        {
          id: "title",
          type: "string",
          content: this[`${language}_title`],
        },
      ],
      link:
        path != undefined
          ? {
              url: path,
              method: "get",
            }
          : undefined,
    };
    if (store.state.sections_use) {
      card.content?.push({
        id: "section",
        type: "string",
        content: getCurrentElement("section") + ": " + this.section,
      });
    }

    return card;
  }
}

type CourseBaseProps = {
  id: number;
  credits: number;
  learning_area_ref: ResponseItem<{
    id: string;
  }>;
} & {
  [key in keyof string as `${Language}_title`]: string;
};

type CourseSummaryProps = CourseBaseProps & {
  section?: string;
  group: number;
  final_confirmation: string | null;
};

type EnrollmentCourseProps = CourseSummaryProps & {
  pending: string;
};

type CurriculumCourseProps = CourseBaseProps & {
  section: string;
  final_grade: GradeProps | null;
  learning_context_ref: ResponseItem<{
    id: string;
  }>;
  future_course: number;
};

type CourseProps = CourseBaseProps & {
  creation_school_year: number;
  up_hours: number;
  min_students: number;
  max_students: number;
  proposer_teacher_ref: ResponseItem<{
    id: number;
  }>;
  teacher_name: string;
  teacher_surname: string;
  certifying_admin_ref: ResponseItem<{
    id: number;
  }>;
  admin_name: string;
  admin_surname: string;
  admin_confirmation: string;
} & {
  [key in keyof string as `${Language}_expected_learning_results`]: string;
} & {
  [key in keyof string as `${Language}_criterions`]: string;
} & {
  [key in keyof string as `${Language}_activities`]: string;
} & {
  [key in keyof string as `${Language}_learning_area`]: string;
} & {
  [key in keyof string as `${Language}_description`]: string;
};

class CourseBase {
  id: number;
  credits: number;
  learning_area_id: string;
  italian_title: string;
  english_title: string;

  constructor(courseObj: CourseBaseProps) {
    this.id = courseObj.id;
    this.credits = courseObj.credits;
    this.learning_area_id = (
      courseObj.learning_area_ref.data as { id: string }
    ).id; // TODO (6): in /courses/:id vengno dati solo i titoli e non l'id
    this.italian_title = courseObj.italian_title; // TODO (8): sistemare lingue mettendo get
    this.english_title = courseObj.english_title;
  }

  toCard() {
    const language = getCurrentLanguage();
    const card: GeneralCardElements = {
      id: "" + this.id,
      group: "",
      title: getCustomMessage("title", this[`${language}_title`], "title"),
      link: {
        event: "course_details",
        data: {
          title: this[`${language}_title`],
          course_id: this.id,
        },
      },
    };

    return card;
  }
}

class CourseSummary extends CourseBase {
  section?: string | undefined;
  group: number;
  final_confirmation?: Date;

  constructor(courseObj: CourseSummaryProps) {
    super(courseObj);
    this.section = courseObj.section;
    this.group = courseObj.group;
    this.final_confirmation =
      courseObj.final_confirmation != undefined
        ? new Date(courseObj.final_confirmation)
        : undefined;
  }

  toCard() {
    const card: GeneralCardElements = super.toCard();

    card.group = this.group;
    if (card.title != undefined) {
      card.title.content +=
        store.state.sections_use && this.section != null
          ? " - " + getCurrentElement("section") + ": " + this.section
          : "";
    }

    return card;
  }
}

class EnrollmentCourse extends CourseSummary {
  pending: boolean | Date;

  constructor(courseObj: EnrollmentCourseProps) {
    const tmp_pending_date = new Date(courseObj.pending);
    super(courseObj);
    this.pending = !isNaN(tmp_pending_date.getTime())
      ? tmp_pending_date
      : courseObj.pending === "true";
  }

  toEnrollmentCard(
    learning_session: LearningSession,
    path?: string,
    method?: Method,
    data?: TmpList,
    open_enrollment = false,
    reference = new Date()
  ) {
    const language = getCurrentLanguage();
    const tmp_enrollment = new Enrollment(
      this.pending,
      learning_session,
      reference,
      open_enrollment
    );
    const card: EnrollmentCardElements = {
      id: "" + this.id,
      group: this.group,
      credits: this.credits,
      enrollment: tmp_enrollment,
      content: [],
    };

    let tmp_content: ContentType;

    if (data != undefined) {
      if (card.layout == undefined) {
        card.layout = {};
      }
      if (card.layout["xl"] == undefined) {
        card.layout["xl"] = [];
      }
      if (card.layout["sm"] == undefined) {
        card.layout["sm"] = [];
      }
      card.content = [
        {
          id: "group",
          type: "string",
          content: this.group,
        },
        {
          id: "group_sm",
          type: "string",
          content: getCurrentElement("group") + ": " + this.group,
          classes: {
            label: {
              "ion-text-center": true,
            },
          },
        },
        getCustomMessage("empty", ""),
        {
          id: "credits",
          type: "string",
          content: this.credits,
        },
        {
          id: "credits_sm",
          type: "string",
          content: getCurrentElement("credits") + ": " + this.credits,
          classes: {
            label: {
              "ion-text-center": true,
            },
          },
        },
        {
          id: "title",
          type: "string",
          linkType: "event",
          content: {
            event: "course_details",
            data: {
              title: this[`${language}_title`],
              course_id: this.id,
              section: this.section,
            },
            text: this[`${language}_title`],
          },
          colors: {
            text: {
              name: "primary",
              type: "var",
            },
          },
        },
      ];
      (card.layout["xl"] as (string | number)[]).push(
        "group",
        "credits",
        "title"
      );
      (card.layout["sm"] as LayoutElement[][]).push(
        [
          {
            id: "title",
          },
        ],
        [
          {
            id: "group_sm",
            size: "5",
          },
          {
            id: "empty",
            size: "2",
          },
          {
            id: "credits_sm",
            size: "5",
          },
        ]
      );

      if (store.state.sections_use) {
        card.content.push(
          {
            id: "section",
            type: "string",
            content: this.section ?? "",
          },
          {
            id: "section_sm",
            type: "string",
            content:
              getCurrentElement("section") + ": " + (this.section ?? "-"),
            classes: {
              label: {
                "ion-text-center": true,
              },
            },
          }
        );
        (card.layout["xl"] as (string | number)[]).push("section");
        (card.layout["sm"] as LayoutElement[][]).push([
          {
            id: "empty",
            size: "3",
          },
          {
            id: "section_sm",
            size: "6",
          },
        ]);
      }
      tmp_content = {
        event: "move_student",
        data: data,
        icon: getIcon("checkmark"),
      };
      card.content.push(
        {
          id: "move_student",
          type: "icon",
          linkType: "event",
          content: tmp_content,
        },
        {
          id: "move_student_sm",
          type: "string_icon",
          linkType: "event",
          content: Object.assign(tmp_content, {
            text: getCurrentElement("subscribe_to"),
            whole_link: true,
          }),
          ...store.state.button_css,
        }
      );
      (card.layout["xl"] as (string | number)[]).push("move_student");
      (card.layout["sm"] as LayoutElement[][]).push([
        {
          id: "move_student_sm",
        },
      ]);
    } else {
      card.content = [
        {
          id: "credits",
          type: "string",
          content: getCurrentElement("credits") + ": " + this.credits,
          colors: {
            text: {
              name: "white",
              type: "var",
            },
            background: {
              name: "primary",
              type: "var",
            },
          },
        },
        {
          id: "title",
          type: "string",
          linkType: "event",
          content: {
            event: "course_details",
            data: {
              title: this[`${language}_title`],
              course_id: this.id,
              section: this.section,
            },
            text:
              this[`${language}_title`] +
              (store.state.sections_use && this.section != null
                ? " - " + getCurrentElement("section") + ": " + this.section
                : ""),
          },
        },
        {
          id: "enrollment",
          type: "string",
          content: tmp_enrollment.toString(),
          colors: tmp_enrollment.getStatusColors(),
        },
      ];

      if (
        (!store.state.static_subscription ||
          tmp_enrollment.enrollment === false) &&
        path != undefined
      ) {
        card.content.push({
          id: this.id + "_change_enrollment",
          type: "icon",
          linkType: "request",
          content: tmp_enrollment.getEnrollmentIcon(path, method),
          colors: tmp_enrollment.getChangeButtonColors(),
          params: {
            border_radius: "10px",
          },
        });
      }
    }

    return card;
  }
}

class CurriculumCourse extends CourseBase {
  section: string;
  final_grade: GradeProps | null;
  learning_context_id: string;
  future_course: boolean;

  constructor(courseObj: CurriculumCourseProps) {
    super(courseObj);
    this.section = courseObj.section;
    this.final_grade = courseObj.final_grade;
    this.learning_context_id = (
      courseObj.learning_context_ref.data as { id: string }
    ).id;
    this.future_course = courseObj.future_course == 1;
  }

  /*concatGrades(grades : Grade[]) {
        
        let finalPos : number;

        if (grades.length > 0) {
            finalPos = grades.findIndex((grade) => grade.final);
            if (finalPos >= 0) {
                this.final_grade = grades.splice(finalPos,1);
            }
        }
        this.intermediate_grades = this.intermediate_grades.concat(grades);
    }*/

  toTableCard(
    session_id: number,
    student_id: number,
    teacher_id?: number
  ): GeneralTableCardElements {
    // TODO (7): valutare se unire a toCard, visto che il tipo di dato è diventato lo stesso
    const language = getCurrentLanguage();
    const tmp_content: ContentType = {
      event: "grades",
      data: {
        title: this[`${language}_title`],
        parameters: {
          course_id: this.id,
          session_id: session_id,
          student_id: student_id,
          teacher_id: teacher_id,
        },
      },
      icon: getIcon("document_text"),
    };
    const final_grade = this.final_grade != null ? "" + this.final_grade : "-";
    const row: GeneralTableCardElements = {
      id: "" + this.id,
      group: "",
      content: [
        {
          id: "title",
          type: "string",
          linkType: "event",
          content: {
            event: "course_details",
            data: {
              title: this[`${language}_title`],
              course_id: this.id,
              learning_session_id: session_id,
              section: this.section,
            },
            text: this[`${language}_title`],
          },
          classes: {
            label: {
              "ion-text-wrap": true,
              "ion-text-start": true,
            },
          },
          colors: {
            text: {
              name: "primary",
              type: "var",
            },
          },
        },
        {
          id: "credits",
          type: "string",
          content: "" + this.credits,
        },
        {
          id: "credits_sm",
          type: "string",
          content: getCurrentElement("credits") + ": " + this.credits,
        },
        {
          id: "learning_area",
          type: "string",
          content: this.learning_area_id,
        },
        {
          id: "learning_area_sm",
          type: "string",
          content:
            getCurrentElement("learning_area") + ": " + this.learning_area_id,
        },
        {
          id: "gardes", // TODO (4): mettere il controllo con future_course al passaggio a curriculum_v2
          type: "icon",
          linkType: "event",
          content: tmp_content,
        },
        {
          id: "final_grade",
          type: "string",
          content: final_grade,
        },
        getCustomMessage(
          "final_grade_sm",
          getCurrentElement("final_grade") + ": " + final_grade,
          "string"
        ),
        {
          id: "grades_sm",
          type: "string_icon",
          linkType: "event",
          content: Object.assign(tmp_content, {
            text: getCurrentElement("grades"),
            whole_link: true,
          }),
          ...store.state.button_css,
        },
      ],
      layout: {
        xl: ["title", "credits", "learning_area", "gardes", "final_grade"],
        sm: [
          [
            {
              id: "title",
            },
          ],
          [
            {
              id: "credits_sm",
            },
          ],
          [
            {
              id: "learning_area_sm",
            },
          ],
          [
            {
              id: "final_grade_sm",
              size: "auto",
            },
          ],
          [
            {
              id: "grades_sm",
              size: "auto",
            },
          ],
        ],
      },
    };
    if (store.state.sections_use) {
      row.content.splice(1, 0, {
        id: "section", // TODO (8): Mettere differenza tra visualizzazione con corso frequentato una volta e più
        type: "string",
        content: this.section,
      });
    }
    return row;
  }
}

class Course extends CourseBase {
  // TODO (6): "unire" con ModelProposition

  creation_school_year: number;
  up_hours: number;
  min_students: number;
  max_students: number;
  proposer_teacher: TeacherSummary;
  certifying_admin?: AdminSummary;
  admin_confirmation?: string;
  italian_expected_learning_results: string;
  english_expected_learning_results: string;
  italian_criterions: string; // TODO (7): vedere se conviene raggruppare le cose con le lingue in oggetti, per poter rendere più facile l'aggiunta di lingue
  english_criterions: string;
  italian_activities: string;
  english_activities: string;
  italian_learning_area: string;
  english_learning_area: string;
  italian_description: string;
  english_description: string;
  access_object: PropositionAccessObject;
  teaching_list: Teaching[];
  growth_list: GrowthArea[];
  images_list: ImageDescriptor[];
  private learning_contexts: {
    [key: string]: LearningContext;
  };

  constructor(courseObj: CourseProps) {
    super(courseObj);
    this.creation_school_year = courseObj.creation_school_year;
    this.up_hours = courseObj.up_hours;
    this.min_students = courseObj.min_students;
    this.max_students = courseObj.max_students;
    this.proposer_teacher = new TeacherSummary({
      id: (courseObj.proposer_teacher_ref.data as { id: number }).id,
      name: courseObj.teacher_name,
      surname: courseObj.teacher_surname,
    });
    this.certifying_admin = new AdminSummary({
      id: (courseObj.certifying_admin_ref.data as { id: number }).id,
      name: courseObj.admin_name,
      surname: courseObj.admin_surname,
    });
    this.admin_confirmation = courseObj.admin_confirmation;
    this.italian_expected_learning_results =
      courseObj.italian_expected_learning_results;
    this.english_expected_learning_results =
      courseObj.english_expected_learning_results;
    this.italian_criterions = courseObj.italian_criterions;
    this.english_criterions = courseObj.english_criterions;
    this.italian_activities = courseObj.italian_activities;
    this.english_activities = courseObj.english_activities;
    this.italian_learning_area = courseObj.italian_learning_area;
    this.english_learning_area = courseObj.english_learning_area;
    this.italian_description = courseObj.italian_description;
    this.english_description = courseObj.english_description;
    this.growth_list = [];
    this.teaching_list = [];
    this.access_object = {};
    this.images_list = [];
    this.learning_contexts = {};
  }

  private async loadParams() {
    await executeLink(
      "/v1/courses/" + this.id + "/growth_areas",
      (response) =>
        (this.growth_list = response.data.data.map(
          (a: GrowthAreaProps) => new GrowthArea(a)
        ))
    );
    await executeLink(
      "/v1/courses/" + this.id + "/teachings",
      (response) =>
        (this.teaching_list = response.data.data.map(
          (a: TeachingProps) => new Teaching(a)
        ))
    );
    await executeLink("/v1/courses/" + this.id + "/opento", (response) => {
      let learning_context_id;
      for (const constraint of response.data.data as OpenToConstraint[]) {
        learning_context_id = (
          constraint.learning_context_ref.data as { id: string }
        ).id;
        if (this.access_object[learning_context_id] == undefined) {
          this.access_object[learning_context_id] = [];
        }
        this.access_object[learning_context_id].push({
          study_year: (constraint.study_year_ref.data as { id: number }).id,
          study_address: (constraint.study_address_ref.data as { id: string })
            .id,
          main_study_year: constraint.main_study_year == 1,
          presidium: constraint.presidium == 1,
        });
      }
    });
    await executeLink(
      "/v1/learning_contexts",
      (response) => {
        for (const learning_context of response.data
          .data as LearningContext[]) {
          this.learning_contexts[learning_context.id] = learning_context;
        }
      },
      () => []
    );
    await executeLink("/v1/images/course/" + this.id, (response) => {
      this.images_list = response.data.data;
    });
  }

  static async newCourse(course_link: string) {
    const course = new Course(
      await executeLink(
        course_link,
        (response) => response.data.data,
        () => null
      )
    );
    await course.loadParams();

    return course;
  }

  getAccessCardsList() {
    const language = getCurrentLanguage();
    const access_list: OrderedCardsList<GeneralCardElements> = {
      order: [],
      cards: {},
    };

    let ordinary_classes_cards: {
      [study_address: string]: {
        card: GeneralCardElements;
        study_years: number[];
      };
    };
    let study_address_visualization:
      | {
          icon: IconAlternatives;
          background: ColorObject;
        }
      | undefined;

    for (const learning_context_id of Object.keys(this.access_object)) {
      if (access_list.cards[learning_context_id] == undefined) {
        access_list.order.push({
          key: learning_context_id,
          title: getCustomMessage(
            learning_context_id,
            this.learning_contexts[learning_context_id][`${language}_title`],
            "title",
            {
              text: {
                name: "medium",
                type: "var",
              },
            }
          ),
        });
        access_list.cards[learning_context_id] = [];
      }

      ordinary_classes_cards = {};
      for (const access of this.access_object[learning_context_id]) {
        if (ordinary_classes_cards[access.study_address] == undefined) {
          study_address_visualization = getStudyAddressVisualization(
            access.study_address
          );
          ordinary_classes_cards[access.study_address] = {
            card: {
              id: access.study_address,
              group: learning_context_id,
              content: [
                {
                  id: access.study_address,
                  type:
                    study_address_visualization != undefined
                      ? "string_icon"
                      : "string",
                  content:
                    study_address_visualization != undefined
                      ? {
                          text: "",
                          icon: study_address_visualization.icon,
                          order: true,
                        }
                      : "",
                  colors: {
                    text: {
                      name: "white",
                      type: "var",
                    },
                    background:
                      study_address_visualization != undefined
                        ? study_address_visualization.background
                        : {
                            name: "medium",
                            type: "var",
                          },
                  },
                  classes: {
                    item: {
                      radius: true,
                    },
                  },
                },
              ],
              classes: {
                content: {
                  "ion-no-padding": true,
                },
              },
            },
            study_years: [access.study_year],
          };
        } else {
          ordinary_classes_cards[access.study_address].study_years.push(
            access.study_year
          );
        }
      }

      for (const study_address of Object.keys(ordinary_classes_cards)) {
        ordinary_classes_cards[study_address].study_years.sort();
        (
          (
            ordinary_classes_cards[study_address].card
              .content as CustomElement[]
          )[0].content as StringIcon
        ).text =
          ordinary_classes_cards[study_address].study_years.join("-") +
          " " +
          study_address;
        access_list.cards[learning_context_id].push(
          ordinary_classes_cards[study_address].card
        );
      }
    }

    return access_list;
  }

  getGrowthCardsList(): OrderedCardsList<GeneralCardElements> {
    let tmp_card: GeneralCardElements;

    return {
      order: [],
      cards: {
        "": this.growth_list.map((a) => {
          tmp_card = a.toCard(true);
          (tmp_card.content as CustomElement[])[0].colors = {
            text: {
              name: "white",
              type: "var",
            },
            background: {
              name: "odo",
              type: "var",
            },
          };
          (tmp_card.content as CustomElement[])[0].classes = {
            label: {
              "ion-padding": true,
              radius: true,
              "ion-text-wrap": true,
            },
          };
          tmp_card.classes = {
            content: {
              "ion-no-padding": true,
            },
          };

          return tmp_card;
        }),
      },
    };
  }

  getTeachingCardsList(): OrderedCardsList<GeneralCardElements> {
    let tmp_card: GeneralCardElements;
    return {
      order: [],
      cards: {
        "": this.teaching_list.map((a) => {
          tmp_card = a.toCard(true);
          (tmp_card.content as CustomElement[])[0].colors = {
            text: {
              name: "white",
              type: "var",
            },
            background: {
              name: "bio",
              type: "var",
            },
          };
          (tmp_card.content as CustomElement[])[0].classes = {
            label: {
              "ion-padding": true,
              radius: true,
              "ion-text-wrap": true,
            },
          };
          tmp_card.classes = {
            content: {
              "ion-no-padding": true,
            },
          };

          return tmp_card;
        }),
      },
    };
  }

  toCard(user?: User) {
    const language = getCurrentLanguage();

    const hours_per_credit: number = store.state.hours_per_credit;
    const hours = this.credits * hours_per_credit;

    const course: GeneralCardElements = {
      id: "" + this.id,
      group: "",
      content: [
        {
          id: this.id + "_description", // TODO (9): usare getCustomMessage
          type: "html",
          content: this[`${language}_description`],
        },
        {
          id: this.id + "_expected_learning_resuts_title",
          type: "title",
          content: getCurrentElement("expected_learning_results").toUpperCase(),
        },
        {
          id: this.id + "_expected_learning_resuts",
          type: "html",
          content: this[`${language}_expected_learning_results`],
        },
        {
          id: this.id + "_criterions_title",
          type: "title",
          content: getCurrentElement("criterions").toUpperCase(),
        },
        {
          id: this.id + "_criterions",
          type: "html",
          content: this[`${language}_criterions`],
        },
        {
          id: this.id + "_activities_title",
          type: "title",
          content: getCurrentElement("activities").toUpperCase(),
        },
        {
          id: this.id + "_activities",
          type: "html",
          content: this[`${language}_activities`],
        },
        {
          id: this.id + "_technical_information",
          type: "title",
          content: getCurrentElement("characteristics").toUpperCase(),
        },
        {
          id: this.id + "_learning_area",
          type: "html",
          content:
            "<b>" +
            getCurrentElement("learning_area") +
            "</b>: " +
            this[`${language}_learning_area`], // TODO (8): mettere grasseto dentro
        },
        {
          id: this.id + "_credits",
          type: "html",
          content:
            "<b>" +
            getCurrentElement("credits") +
            "</b>: " +
            this.credits +
            " (" +
            hours +
            " " +
            getCurrentElement(hours == 1 ? "hour" : "hours") +
            ")",
        },
        {
          id: this.id + "_up_hours",
          type: "html",
          content:
            "<b>" +
            getCurrentElement("up_hours") +
            "</b>: " +
            this.up_hours +
            " " +
            getCurrentElement(this.up_hours == 1 ? "hour" : "hours"),
        },
        {
          id: this.id + "_students_number",
          type: "html",
          content:
            "<b>" +
            getCurrentElement("students_number") +
            "</b>: <ul class='ion-no-margin'><li>" +
            getCurrentElement("min") +
            ": " +
            this.min_students +
            "</li><li>" +
            getCurrentElement("max") +
            ": " +
            this.max_students +
            "</li></ul>",
        },
        {
          id: this.id + "_proposer_teacher",
          type: "html",
          content:
            "<b>" +
            getCurrentElement("proposer_teacher") +
            "</b>: " +
            this.proposer_teacher.surname +
            " " +
            this.proposer_teacher.name,
        },
      ],
    };

    if (user != undefined && user.type != "student") {
      course.content?.push({
        id: this.id + "_creation_date",
        type: "html",
        content:
          "<b>" +
          getCurrentElement("creation_school_year") +
          "</b>: " +
          this.creation_school_year,
      });
      if (this.certifying_admin != undefined) {
        course.content?.push({
          id: this.id + "_certifying_admin",
          type: "html",
          content:
            "<b>" +
            getCurrentElement("certifying_admin") +
            "</b>: " +
            this.certifying_admin.name +
            " " +
            this.certifying_admin.surname,
        });
      }
    }

    return course;
  }
}

type LearningSessionUpdateProps = {
  start: string;
  end: string;
  num_groups: number;
  open_day: string;
};

type LearningSessionCreateProps = {
  number: number;
  school_year: number;
} & LearningSessionUpdateProps;

type LearningSessionProps = {
  id: number;
} & LearningSessionCreateProps;

class LearningSessionSummary {
  id: number;
  number: number;
  school_year: number;

  constructor(sessionObj: { id: number; number: number; school_year: number }) {
    this.id = sessionObj.id;
    this.number = sessionObj.number;
    this.school_year = sessionObj.school_year;
  }
}

class LearningSession extends LearningSessionSummary {
  // TODO (4): sistema numero-anno dove visualizzo solo ID

  start: Date;
  end: Date;
  num_groups: number;
  open_day: Date;
  private static attributes_to_update_templates: {
    [key: string]: (breakpoint: Breakpoint | "", id: number) => string;
  } = {
    start: (breakpoint: Breakpoint | "", id: number) =>
      `start${LearningSession.getBreakpointTableElement(breakpoint)}_${id}`,
    end: (breakpoint: Breakpoint | "", id: number) =>
      `end${LearningSession.getBreakpointTableElement(breakpoint)}_${id}`,
    num_groups: (breakpoint: Breakpoint | "", id: number) => {
      id;
      return `groups${LearningSession.getBreakpointTableElement(breakpoint)}`;
    },
    open_day: (breakpoint: Breakpoint | "", id: number) =>
      `open_day${LearningSession.getBreakpointTableElement(breakpoint)}_${id}`,
  }; // LearningSessionUpdateProps
  private static attributes_templates: {
    [key: string]: (breakpoint: Breakpoint | "") => string;
  } = {
    number: (breakpoint: Breakpoint | "") =>
      breakpoint != "" ? "number_school_year" : "number",
    school_year: (breakpoint: Breakpoint | "") =>
      breakpoint != "" ? "number_school_year" : "school_year",
    ...LearningSession.attributes_to_update_templates,
  }; // LearningSessionProps

  constructor(sessionObj: LearningSessionProps) {
    super(sessionObj);

    this.start = new Date(sessionObj.start);
    this.end = new Date(sessionObj.end);
    this.num_groups = sessionObj.num_groups;
    this.open_day = new Date(sessionObj.open_day);
  }

  static copy(session: LearningSession) {
    return new LearningSession({
      id: session.id,
      number: session.number,
      school_year: session.school_year,
      start: session.start.toISOString(),
      end: session.end.toISOString(),
      num_groups: session.num_groups,
      open_day: session.open_day.toISOString(),
    });
  }

  toString(full_school_year = false) {
    return (
      this.number +
      " - " +
      (full_school_year
        ? this.school_year + "-" + (this.school_year + 1)
        : this.school_year)
    );
  }

  static toString(session: LearningSession, full_school_year = false) {
    return (
      session.number +
      " - " +
      (full_school_year
        ? session.school_year + "-" + (session.school_year + 1)
        : session.school_year)
    );
  }

  getStatus(reference = new Date()) {
    // future [TDB] upcoming [SD] current [ED] completed
    const start_date = this.start;
    const end_date = this.end;
    const ten_days_before = new Date(start_date);
    ten_days_before.setDate(ten_days_before.getDate() - 10);

    return reference < ten_days_before
      ? LearningSessionStatus.FUTURE
      : reference >= ten_days_before && reference < start_date
      ? LearningSessionStatus.UPCOMING
      : reference >= start_date && reference <= end_date
      ? LearningSessionStatus.CURRENT
      : LearningSessionStatus.COMPLETED;
  }

  /*async getDividedCourseList(session: LearningSession, learning_areas: LearningArea[]) {
        const language = getCurrentLanguage();
        const courses : EnrollmentCourse[] = (await $axios.get("/v1/courses?student_id=" + user_id + "&session_id=" + session.id)).data.data;
        let tmp_learning_area_id : string,
            tmp_learning_area : LearningArea | undefined,
            i : number,
            course_list = "";
        while (courses.length > 0) {
            tmp_learning_area_id = courses[0].learning_area_id;
            tmp_learning_area = learning_areas.find(area => area.id == tmp_learning_area_id);
            course_list += "<label>" + (tmp_learning_area != undefined ? tmp_learning_area[`${language}_title`] : "") + ":</label><br /><ul>";
            i = 0;
            while (i < courses.length) {
            if (courses[i].learning_area_id == tmp_learning_area_id) {
                course_list += "<li>" + courses[i][`${language}_title`] + "</li>";
                courses.splice(i,1);
            } else {
                i++;
            }
            }
        }

        return course_list;
    }*/

  async getSessionList(
    learning_context?: LearningContextSummary,
    reference = new Date(),
    credits?: boolean,
    courses_list?: boolean,
    user = User.getLoggedUser() as UserSummary,
    text_color?: ColorObject
  ): Promise<string> {
    const language = getCurrentLanguage();

    const status = this.getStatus(reference);
    const put_credits = credits ?? status == LearningSessionStatus.FUTURE;
    const put_courses_list =
      courses_list ??
      (status == LearningSessionStatus.CURRENT ||
        status == LearningSessionStatus.UPCOMING);
    const actual_learning_context = getActualLearningContext(learning_context);
    const courses: {
      [learning_area_id: string]: EnrollmentCourse[];
    } = {};
    const learning_areas = await executeLink(
      "/v1/learning_areas?all_data=true&session_id=" +
        this.id +
        "&credits=" +
        put_credits,
      (response) => response.data.data,
      () => []
    );

    let courses_presence: boolean;
    let session_list = put_courses_list
      ? ""
      : "<ul class='ion-no-margin'" +
        (text_color != undefined
          ? " style='color: " + getCssColor(text_color) + "'"
          : "") +
        ">";

    await executeLink(
      "/v1/courses?student_id=" +
        user.id +
        "&context_id=" +
        actual_learning_context.id +
        "&session_id=" +
        this.id,
      (response) =>
        (response.data.data as EnrollmentCourseProps[]).map((x) => {
          const course = new EnrollmentCourse(x);
          const learning_area_id = course.learning_area_id;
          if (courses[learning_area_id] == undefined) {
            courses[learning_area_id] = [];
          }
          courses[learning_area_id].push(course);
        })
    );

    for (const area of learning_areas) {
      session_list +=
        (put_courses_list ? "<label>" : "<li>") +
        area[`${language}_title`] +
        ": " +
        (put_credits
          ? (courses[area.id] != undefined
              ? getSubscribedCredits(courses[area.id])
              : 0) +
            "/" +
            area.credits
          : "") +
        (put_courses_list ? "</label>" : "</li>");
      if (put_courses_list) {
        courses_presence =
          courses[area.id] != undefined && courses[area.id].length > 0;
        session_list += courses_presence
          ? "<ul class='ion-no-margin'>"
          : "<br />";
        if (courses_presence) {
          for (const course of courses[area.id]) {
            if (course.pending === true) {
              session_list +=
                "<li>" +
                course[`${language}_title`] +
                (store.state.sections_use &&
                (status == LearningSessionStatus.CURRENT ||
                  status == LearningSessionStatus.UPCOMING) &&
                course.section != null
                  ? " - " + getCurrentElement("section") + " " + course.section
                  : "") +
                "</li>";
            }
          }
          session_list += "</ul>";
        }
      }
    }
    session_list += put_courses_list ? "" : "</ul>";

    return session_list;
  }

  async getSubscribedCredits(
    learning_context_id: string,
    user = User.getLoggedUser() as UserSummary
  ): Promise<{ credits: number; courses_presence: boolean }> {
    return executeLink(
      "/v1/courses?student_id=" +
        user.id +
        "&session_id=" +
        this.id +
        "&context_id=" +
        learning_context_id,
      (response) => {
        return {
          credits: getSubscribedCredits(response.data.data),
          courses_presence: response.data.data.length > 0,
        };
      },
      () => {
        return {
          credits: 0,
          courses_presence: false,
        };
      }
    );
  }

  async toCard(
    selected?: boolean,
    learning_context?: LearningContextSummary,
    credits?: boolean,
    courses_list?: boolean,
    courses_badge = false,
    reference = new Date()
  ): Promise<GeneralCardElements> {
    const status = this.getStatus(reference);
    const put_credits = credits ?? status == LearningSessionStatus.FUTURE;
    const actual_learning_context: LearningContextSummary =
      getActualLearningContext(learning_context);
    const subscribed_credits =
      selected == undefined &&
      (status != LearningSessionStatus.COMPLETED ||
        credits != undefined ||
        courses_list != undefined) &&
      put_credits
        ? await this.getSubscribedCredits(actual_learning_context.id)
        : {
            credits: 0,
            courses_presence: false,
          };
    const tmp_element: GeneralCardElements = {
      id: "" + this.id,
      group: this.school_year,
      title: getCustomMessage(
        "title",
        getCurrentElement("session") + " " + this.number,
        "title"
      ),
      subtitle: getCustomMessage(
        "subtitle",
        getRagneString(new Date(this.start), new Date(this.end))
      ),
      content:
        selected == undefined &&
        (status != LearningSessionStatus.COMPLETED ||
          credits != undefined ||
          courses_list != undefined)
          ? [
              {
                id: "open_day",
                type: "string",
                content:
                  getCurrentElement("open_day") +
                  ": " +
                  toDateString(this.open_day), // TODO (4): sistemare titoli che appaiono più piccoli, cambiando il tipo in "title"
              },
              {
                id: "description",
                type: "html",
                content:
                  (put_credits
                    ? "<label>" +
                      getCurrentElement("credits_constraints") +
                      (courses_badge && subscribed_credits.courses_presence
                        ? " <b>[" +
                          getCurrentElement("consultable_courses") +
                          "]</b>"
                        : "") +
                      ":" +
                      (actual_learning_context.credits != null
                        ? " " +
                          subscribed_credits.credits +
                          "/" +
                          actual_learning_context.credits
                        : "") +
                      "</label>"
                    : "") +
                  (actual_learning_context.credits == null
                    ? await this.getSessionList(
                        actual_learning_context,
                        reference,
                        credits,
                        courses_list
                      )
                    : ""),
              },
            ]
          : undefined,
      side_element:
        selected != undefined
          ? {
              id: "status",
              type: "string",
              colors: {
                text: {
                  name: getStatusColor(status),
                  type: "var",
                },
              },
              content: getStatusString(status),
            }
          : undefined,
      selected: selected,
      link:
        selected == undefined
          ? {
              url: "learning_sessions/" + this.id,
              method: "get",
            }
          : {
              event: "change_selection",
              data: {
                id: this.id,
              },
            },
    };

    return tmp_element;
  }

  static getBreakpointTableElement(breakpoint: Breakpoint | "") {
    return breakpoint != "" && isSmaller(breakpoint, "md") ? "_md" : "";
  }

  toTableCard(mode: PropositionActions): GeneralTableCardElements {
    const content: CustomElement[] =
      mode == "view"
        ? [
            getCustomMessage("number", "" + this.number),
            getCustomMessage(
              "school_year",
              this.school_year + "-" + (this.school_year + 1)
            ),
            getCustomMessage(
              "number_school_year",
              getCurrentElement("learning_session") + " " + this.toString(true),
              "title"
            ),
            getCustomMessage("start", toDateString(this.start)),
            getCustomMessage("end", toDateString(this.end)),
            getCustomMessage(
              "duration",
              toDateString(this.start) + " - " + toDateString(this.end)
            ),
            getCustomMessage("groups", "" + this.num_groups),
            getCustomMessage(
              "groups_md",
              getCurrentElement("groups") + ": " + this.num_groups
            ),
            getCustomMessage("open_day", toDateString(this.open_day, true)),
            getCustomMessage(
              "open_day_md",
              getCurrentElement("open_day") +
                ": " +
                toDateString(this.open_day, true)
            ),
          ]
        : [
            getCustomMessage("number", "" + this.number),
            getCustomMessage(
              "school_year",
              "" + this.school_year + "-" + (this.school_year + 1)
            ),
            getCustomMessage(
              "number_school_year",
              getCurrentElement("learning_session") +
                ": " +
                this.toString(true),
              "title"
            ),
            {
              id: "start_" + this.id,
              type: "input_date",
              content: toDateString(this.start),
              params: {
                placeholder: getCurrentElement("start"),
                show_clear_button: false,
                presentation: "date",
              },
            },
            {
              id: "start_md_" + this.id,
              type: "input_date",
              content: toDateString(this.start),
              params: {
                label: getCurrentElement("start"),
                show_clear_button: false,
                presentation: "date",
              },
            },
            {
              id: "end_" + this.id,
              type: "input_date",
              content: toDateString(this.end),
              params: {
                placeholder: getCurrentElement("end"),
                show_clear_button: false,
                presentation: "date",
              },
            },
            {
              id: "end_md_" + this.id,
              type: "input_date",
              content: toDateString(this.end),
              params: {
                label: getCurrentElement("end"),
                show_clear_button: false,
                presentation: "date",
              },
            },
            {
              id: "groups",
              type: "input",
              content: this.num_groups,
              params: {
                placeholder: getCurrentElement("groups"),
                type: "number",
              },
            },
            {
              id: "groups_md",
              type: "input",
              content: this.num_groups,
              params: {
                label: getCurrentElement("groups"),
                type: "number",
              },
            },
            {
              id: "open_day_" + this.id,
              type: "input_date",
              content: toDateString(this.open_day, true),
              params: {
                placeholder: getCurrentElement("open_day"),
                show_clear_button: false,
              },
            },
            {
              id: "open_day_md_" + this.id,
              type: "input_date",
              content: toDateString(this.open_day, true),
              params: {
                label: getCurrentElement("open_day"),
                show_clear_button: false,
              },
            },
          ];

    const layout: { [key: string]: string[] } =
      mode == "view"
        ? {
            xl: ["number", "school_year", "start", "end", "groups", "open_day"],
            md: ["number_school_year", "duration", "groups_md", "open_day_md"],
          }
        : {
            xl: [
              "number",
              "school_year",
              "start_" + this.id,
              "end_" + this.id,
              "groups",
              "open_day_" + this.id,
            ],
            md: [
              "number_school_year",
              "start_md_" + this.id,
              "end_md_" + this.id,
              "groups_md",
              "open_day_md_" + this.id,
            ],
          };

    return {
      id: "" + this.id,
      group: "",
      content: content,
      layout: layout,
    };
  }

  static cleanBackendUpdateObject(backend_update_values: {
    [key: string]: any;
  }) {
    let put_time;

    for (const key of Object.keys(backend_update_values)) {
      put_time = false;
      switch (key) {
        case "num_groups":
          backend_update_values[key] = parseInt(backend_update_values[key]);
          break;
        case "open_day":
          put_time = true;
          backend_update_values[key] = getDateStringToSend(
            backend_update_values[key],
            put_time
          );
          break;
        case "start":
        case "end":
          backend_update_values[key] = getDateStringToSend(
            backend_update_values[key],
            put_time
          );
          break;
      }
    }
  }

  static cleanBackendObject(backend_values: { [key: string]: any }) {
    LearningSession.cleanBackendUpdateObject(backend_values);
    backend_values.number = parseInt(
      backend_values.number.split(": ")[1].split(" - ")[0].trim()
    );
    backend_values.school_year = parseInt(
      backend_values.school_year
        .split(": ")[1]
        .split(" - ")[1]
        .split("-")[0]
        .trim()
    );
  }

  static getBackendCreateObject(
    table_card: GeneralTableCardElements,
    container_width: number
  ): LearningSessionCreateProps {
    const backend_values = getCardValues(
      table_card,
      LearningSession.attributes_templates,
      parseInt(table_card.id),
      container_width,
      ["md"]
    ) as LearningSessionCreateProps;
    LearningSession.cleanBackendObject(backend_values);

    return backend_values;
  }

  static getBackendUpdateObject(
    table_card: GeneralTableCardElements,
    container_width: number
  ): LearningSessionUpdateProps {
    const backend_update_values = getCardValues(
      table_card,
      LearningSession.attributes_to_update_templates,
      parseInt(table_card.id),
      container_width,
      ["md"]
    ) as LearningSessionUpdateProps;
    LearningSession.cleanBackendUpdateObject(backend_update_values);

    return backend_update_values;
  }

  equalToBackupUpdateObject(
    backend_object: LearningSessionUpdateProps
  ): boolean {
    for (const [key, value] of Object.entries(backend_object)) {
      if (
        (["start", "end", "open_day"].includes(key) &&
          value !== toDateString((this as any)[key] as Date)) ||
        (["num_groups"].includes(key) &&
          parseInt(value as string) !== (this as any)[key])
      ) {
        return false;
      }
    }
    return true;
  }

  updateFromTableCard(
    table_card: GeneralTableCardElements,
    container_width: number
  ) {
    const attributes_update_values = LearningSession.getBackendUpdateObject(
      table_card,
      container_width
    );

    for (const [key, value] of Object.entries(attributes_update_values)) {
      (this as any)[key] = ["start", "end", "open_day"].includes(key)
        ? dateStringToDate(value as string, true)
        : value;
    }
  }
}

type IconAlternatives = {
  ios: string;
  md: string;
};

type IconsList = {
  [key: string]: IconAlternatives;
};

type StringIcon = {
  text: string;
  icon: IconAlternatives;
  order?: boolean;
};

type RequestParameters = {
  url: string; // TODO (6): cambiare in Url o RouteLocationRaw (o simile)
  method: Method;
};

type EventParameters = {
  event: string;
  data?: {
    [key: string]: any;
  };
};

type LinkParameters = RequestParameters | EventParameters;

type RequestIcon = RequestParameters & {
  icon: IconAlternatives;
};

type EventIcon = EventParameters & {
  icon: IconAlternatives;
};

type RequestString = RequestParameters & {
  text: string;
};

type EventString = EventParameters & {
  text: string;
};

type RequestStringIcon = {
  whole_link?: boolean;
} & RequestParameters &
  StringIcon;

type EventStringIcon = {
  whole_link?: boolean;
} & EventParameters &
  StringIcon;

type CardsList<T extends CardElements = CardElements> = TmpList<T[]>;
/**
type CardsList<T = CardElements> = {
  [key: string | number]: T[];
};
 */

type OrderedCardsList<T extends CardElements = CardElements> = {
  order: {
    key: string | number;
    title: CustomElement;
  }[];
  cards: CardsList<T>; // TODO (6): mettere classes e colors per dividers e forse per tutta la lista
};

type ElementType =
  | "string"
  | "html"
  | "icon"
  | "title"
  | "string_icon"
  | "input"
  | "checkbox"
  | "input_date";

type LinkType = "request" | "event";

type ContentType =
  | string
  | number
  | boolean
  | IconAlternatives
  | StringIcon
  | RequestIcon
  | EventIcon
  | RequestString
  | EventString
  | RequestStringIcon
  | EventStringIcon;

type ColorType = "var" | "text" | "hex";

type ColorObject = {
  name: string;
  alpha?: number;
  type: ColorType;
};

type GeneralSubElements = "text" | "background" | "borders" | "hover"; // TODO (6): Valutare se generalizzare con string qui e su classi

type IonInputSubElements = "placeholder";

type IonCheckboxSubElements =
  | "checkmark"
  | "background_checked"
  | "borders_checked";

type CustomSubElements =
  | GeneralSubElements
  | IonInputSubElements
  | IonCheckboxSubElements;

type GeneralCardSubElements =
  | GeneralSubElements
  | "dividers_text"
  | "external_borders"
  | "cards_borders"
  | "list_borders"
  | "dividers"; // TODO (6): Mettere hover dove necessario

type SubElements =
  | "label"
  | "html"
  | "icon"
  | "button"
  | "item"
  | "input"
  | "checkbox";

type CardSubElements = "card" | "header" | "content";

type SelectSubElements = "select" | "option";

type EditorSubElements = "editor";

type CardsCommonElements = CardSubElements | "divider" | "item";

type CardsListElements = CardsCommonElements | "list";

type CardsGridElements = CardsCommonElements | "grid" | "row" | "col";

type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl";

type BreakpointScope = Breakpoint | "general";

type BreakpointVisibility<T extends Breakpoint | BreakpointScope, U> = {
  [key in keyof string as T]?: U;
};

type Colors<T extends CustomSubElements | GeneralCardSubElements> = {
  [key in keyof string as T]?: ColorObject;
};

type Classes<
  T extends
    | SubElements
    | CardsListElements
    | CardsGridElements
    | SelectSubElements
    | EditorSubElements,
  U extends boolean | BreakpointVisibility<BreakpointScope, boolean> =
    | boolean
    | BreakpointVisibility<BreakpointScope, boolean>
> = {
  [key in keyof string as T]?: {
    [key: string]: U;
  };
};

type CustomElement = {
  // TODO (6): togliere type e usare funzioni is... o roba tipo CustomElement<T>
  id: string;
  type: ElementType;
  linkType?: LinkType;
  colors?: Colors<CustomSubElements>;
  classes?: Classes<SubElements>;
  params?: TmpList;
  content: ContentType;
  hovered?: boolean;
};

type TableElement = CustomElement & {
  size?: string | BreakpointVisibility<Breakpoint, string>;
};

enum EditableState {
  NOT_EDITABLE,
  EDITABLE,
  AFTER_7_DAYS,
}

type GradeProps = {
  id: number;
  publication: string;
  grade: number;
  final: number;
} & {
  [key in keyof string as `${Language}_description`]: string;
} & {
  [key: string]: any;
};

class Grade {
  [key: string]: any;

  id: number;
  publication: Date;
  grade: number;
  italian_description: string;
  english_description: string;
  final: boolean;

  constructor(props: GradeProps) {
    this.id = props.id;
    this.publication = new Date(props.publication);
    this.grade = props.grade;
    this.italian_description = props.italian_description;
    this.english_description = props.english_description;
    this.final = props.final == 1;
  }

  getEditableStatus(final_grade_pubblication?: Date) {
    const seven_days_after =
      final_grade_pubblication != undefined
        ? new Date(final_grade_pubblication)
        : undefined;

    if (seven_days_after != undefined) {
      seven_days_after.setDate(seven_days_after.getDate() + 7);
    }

    return seven_days_after == undefined ||
      (this.final && new Date() <= seven_days_after)
      ? EditableState.EDITABLE
      : new Date() > seven_days_after
      ? EditableState.AFTER_7_DAYS
      : EditableState.NOT_EDITABLE;
  }

  toTableCard(
    associated_teacher?: boolean,
    teacher_id?: number,
    student_id?: number,
    final_grade_pubblication?: Date,
    show_editable = true
  ): GeneralTableCardElements {
    const language = getCurrentLanguage();

    const row: GeneralTableCardElements = {
      id: "" + this.id,
      group: "",
      content: [
        {
          id: "description",
          type: "html",
          content: this[`${language}_description`],
          colors: {
            text: {
              name: "primary",
              type: "var",
            },
          },
        },
        {
          id: "pubblication",
          type: "string",
          content: toDateString(this.publication),
        },
        {
          id: "value",
          type: "html",
          content:
            (this.final
              ? "<b>" + getCurrentElement("final") + "</b><br />"
              : "") + this.grade,
        },
        {
          id: "value_sm",
          type: "html",
          content:
            getCurrentElement("grade") +
            (this.final ? " (<b>" + getCurrentElement("final") + "</b>)" : "") +
            ": " +
            this.grade,
        },
      ],
      layout: {
        xl: ["description", "pubblication", "value"],
        sm: [
          [
            {
              id: "description",
            },
          ],
          [
            {
              id: "pubblication",
              size: "auto",
            },
          ],
          [
            {
              id: "value_sm",
            },
          ],
        ],
      },
    };
    const editable = show_editable
      ? this.getEditableStatus(final_grade_pubblication)
      : EditableState.AFTER_7_DAYS;

    if (
      student_id != undefined &&
      teacher_id != undefined &&
      associated_teacher != undefined
    ) {
      if (editable == EditableState.EDITABLE && !associated_teacher) {
        // Teacher that can edit and editable grade
        row.content.push(
          {
            id: "edit",
            type: "icon",
            linkType: "event",
            content: {
              event: "edit_grade",
              data: {
                id: this.id,
                teacher_id: teacher_id,
                student_id: student_id,
              },
              icon: getIcon("pencil"),
            },
          },
          {
            id: "remove",
            type: "icon",
            linkType: "event",
            content: {
              event: "remove_grade",
              data: {
                id: this.id,
                student_id: student_id,
              },
              icon: getIcon("close"),
            },
          },
          getCustomMessage("empty", "")
        );
        if (row.layout != undefined) {
          (row.layout["xl"] as (string | number)[]).push("edit", "remove");
          (row.layout["sm"] as LayoutElement[][]).push([
            { id: "empty", size: "3" },
            { id: "edit", size: "2" },
            { id: "empty", size: "1" },
            { id: "remove", size: "2" },
          ]);
        }
      } else if (editable == EditableState.NOT_EDITABLE) {
        // Teacher that can edit but not editable grade
        row.content.push(
          {
            id: "edit",
            type: "string",
            content: "",
          },
          {
            id: "remove",
            type: "string",
            content: "",
          }
        );
        if (row.layout != undefined) {
          (row.layout["xl"] as (string | number)[]).push("edit", "remove");
        }
      }
    }

    return row;
  }

  toProps(): GradeProps {
    return {
      id: this.id,
      publication: this.publication.toISOString(),
      italian_description: this.italian_description,
      english_description: this.english_description,
      grade: this.grade,
      final: this.final ? 1 : 0,
    };
  }
}

type GradesParameters = {
  course_id: number;
  session_id: number;
  teacher_id?: number;
  associated_teacher?: boolean;
};

type SingleGradesParameters = GradesParameters & {
  student_id: number;
  final_grade_index?: number;
  show_editable?: boolean;
};

type MultipleGradesParameters = GradesParameters & {
  section: string;
};

type ProjectClassTeachingsResponse = {
  id: string;
  italian_title: string;
  english_title: string;
  section: string;
  teaching_ref: ResponseItem<{
    id: string;
  }>;
  my_teaching?: boolean;
};

class CourseSectionsTeachings {
  id: string;
  italian_title: string;
  english_title: string;
  sections: Set<string>;
  my_teaching_refs: Set<string>;

  constructor(props: ProjectClassTeachingsResponse) {
    this.id = props.id;
    this.italian_title = props.italian_title;
    this.english_title = props.english_title;
    this.sections = new Set([props.section]);
    this.my_teaching_refs = new Set([
      (
        props.teaching_ref.data as {
          id: string;
        }
      ).id,
    ]);
  }

  toCard(group: string, learning_session: string): GeneralCardElements {
    const language = getCurrentLanguage();
    const card: GeneralCardElements = {
      id: "" + this.id,
      group: group,
      content: [
        {
          id: this.id + "_title",
          type: "title",
          content: this[`${language}_title`],
          classes: {
            label: {
              "ion-text-wrap": true,
            },
          },
        },
      ],
      link: {
        url: "project_courses/" + this.id + "/" + learning_session,
        method: "get",
      },
    };
    if (store.state.sections_use) {
      card.content?.push({
        id: this.id + "_sections",
        type: "string",
        content:
          getCurrentElement("sections") +
          ": " +
          Array.from(this.sections).join(", "),
      });
    }
    card.content?.push({
      id: this.id + "_my_associated_teachings",
      type: "string",
      content:
        getCurrentElement("my_associated_teachings") +
        ": " +
        Array.from(this.my_teaching_refs).join(", "),
    });
    return card;
  }
}

type StudentSummaryProps = {
  id: number;
  name: string;
  surname: string;
};

type StudentProps = StudentSummaryProps & {
  learning_context_ref?: ResponseItem<{
    id: string;
  }>;
  ord_class_study_year: number;
  ord_class_address: string;
  ord_class_section: string;
};

type StudentInformationProps = StudentSummaryProps & {
  username: string;
  gender: string;
  birth_date: string;
  address: string;
  email: string;
  ordinary_class_ref: ResponseItem<{
    study_address: string;
    study_year: number;
  }>;
  class_section: string;
};

class StudentSummary implements StudentSummaryProps {
  id: number;
  name: string;
  surname: string;

  constructor(student: StudentSummaryProps) {
    this.id = student.id;
    this.name = student.name;
    this.surname = student.surname;
  }

  toCard(path: string): GeneralCardElements {
    return {
      id: "" + this.id,
      group: "",
      content: [
        {
          id: this.id + "_name_surname",
          type: "string",
          content: this.name + " " + this.surname,
        },
      ],
      link: {
        url: path,
        method: "get",
      },
    };
  }

  toTableCard(index?: number): GeneralTableCardElements {
    const name_surname: CustomElement = {
      id: "name_surname",
      type: "string",
      linkType: "request",
      content: {
        text: this.name + " " + this.surname,
        url: "/students/" + this.id,
        method: "get",
      },
      colors: {
        text: {
          name: "primary",
          type: "var",
        },
      },
    };

    let to_ret: GeneralTableCardElements;

    if (index != undefined) {
      to_ret = {
        id: "" + this.id,
        group: "",
        content: [
          getCustomMessage("index", index + ""),
          getCustomMessage("index_sm", index + ")"),
        ].concat(name_surname),
        layout: {
          xl: ["index", "name_surname"],
          sm: [
            [
              { id: "index_sm", size: "auto" },
              {
                id: "name_surname",
              },
            ],
          ],
        },
        linked_elements: {
          index: ["index", "index_sm"],
        },
      };
    } else {
      to_ret = {
        id: "" + this.id,
        group: "",
        content: [name_surname],
        layout: {
          xl: ["name_surname"],
          sm: [[{ id: "name_surname" }]],
        },
      };
    }

    return to_ret;
  }
}

type OrdinaryClassStudentProps = StudentSummaryProps & {
  orientation_credits: number;
  clil_credits: number;
};

class OrdinaryClassStudent extends StudentSummary {
  orientation_credits: number;
  clil_credits: number;

  constructor(props: OrdinaryClassStudentProps) {
    super(props);
    this.orientation_credits = props.orientation_credits;
    this.clil_credits = props.clil_credits;
  }

  toTableCard(index?: number, movable = false): GeneralTableCardElements {
    const row_to_return = super.toTableCard(index);

    let tmp_content: ContentType;

    if (User.getLoggedUser()?.type == "admin") {
      row_to_return.content.push(
        {
          id: "orientation_credits",
          type: "string",
          content: this.orientation_credits,
        },
        {
          id: "clil_credits",
          type: "string",
          content: this.clil_credits,
        },
        {
          id: "orientation_credits_sm",
          type: "string",
          content:
            getCurrentElement("orientation_credits") +
            ": " +
            this.orientation_credits,
        },
        {
          id: "clil_credits_sm",
          type: "string",
          content: getCurrentElement("clil_credits") + ": " + this.clil_credits,
        }
      );

      if (row_to_return.layout != undefined) {
        (row_to_return.layout["xl"] as (string | number)[]).push(
          "orientation_credits",
          "clil_credits"
        );
        row_to_return.layout["sm"] = (
          row_to_return.layout["sm"] as LayoutElement[][]
        ).concat([
          [
            {
              id: "orientation_credits_sm",
            },
          ],
          [
            {
              id: "clil_credits_sm",
            },
          ],
        ]);
      }
    }
    if (movable) {
      tmp_content = {
        event: "student_mover",
        data: {
          title: this.name + " " + this.surname,
          parameters: {
            student_id: this.id,
          },
        },
        icon: getIcon("pencil"),
      };
      row_to_return.content.push(
        {
          id: "student_mover",
          type: "icon",
          linkType: "event",
          content: tmp_content,
        },
        {
          id: "student_mover_sm",
          type: "string_icon",
          linkType: "event",
          content: Object.assign(tmp_content as EventStringIcon, {
            text: getCurrentElement("subscribe_to"),
            whole_link: true,
          }),
          ...store.state.button_css,
        }
      );

      if (row_to_return.layout == undefined) {
        row_to_return.layout = {};
      }
      (row_to_return.layout["xl"] as (string | number)[]).push("student_mover");
      (row_to_return.layout["sm"] as LayoutElement[][]).push([
        {
          id: "student_mover_sm",
          size: "5",
        },
      ]);

      if (row_to_return.linked_elements == undefined) {
        row_to_return.linked_elements = {};
      }
    }

    return row_to_return;
  }
}

class ProjectClassStudent extends StudentSummary {
  learning_context_id?: string;
  ordinary_class: OrdinaryClassSummary;
  private associated_project_class_id: {
    course_id: string;
    session_id: string;
  };

  constructor(props: StudentProps, course_id: string, session_id: string) {
    super(props);
    this.learning_context_id =
      props.learning_context_ref != undefined
        ? (props.learning_context_ref.data as { id: string }).id
        : undefined;
    this.ordinary_class = new OrdinaryClassSummary({
      study_year: props.ord_class_study_year,
      address: props.ord_class_address,
      section: props.ord_class_section,
    });
    this.associated_project_class_id = {
      course_id: course_id,
      session_id: session_id,
    };
  }

  /*private concatLayout(first: Layout, second: Layout) {
    const to_ret: Layout = {};

    let tmp_breakpoint: Breakpoint;

    Object.assign(to_ret, first);

    for (const breakpoint in second) {
      tmp_breakpoint = breakpoint as Breakpoint;

      if (to_ret[tmp_breakpoint] == undefined) {
        to_ret[tmp_breakpoint] = second[tmp_breakpoint];
      } else if (
        isLayoutElementMatrix(second[tmp_breakpoint]) &&
        isLayoutElementMatrix(to_ret[tmp_breakpoint])
      ) {
        to_ret[tmp_breakpoint] = (
          to_ret[tmp_breakpoint] as LayoutElement[][]
        ).concat(second[tmp_breakpoint] as LayoutElement[][]);
      } else {
        to_ret[tmp_breakpoint] = (
          to_ret[tmp_breakpoint] as (string | number)[]
        ).concat(second[tmp_breakpoint] as (string | number)[]);
      }
    }

    return to_ret;
  }*/

  toTableCard(
    teacher_id?: number,
    grades?: boolean,
    final_grade?: Grade,
    final_confirmation?: Date,
    linked_input = false,
    index?: number
  ): GeneralTableCardElements {
    // TODO (7): usare AdminProjectClassProps quando verrà cambiato nome e sistemato in giro
    const row_to_return = super.toTableCard(index);

    let tmp_content: ContentType, actual_final_grade: string, tmp_len: number;

    if (row_to_return.layout == undefined) {
      row_to_return.layout = {};
    }
    if (row_to_return.layout["xl"] == undefined) {
      row_to_return.layout["xl"] = [];
    }
    if (row_to_return.layout["sm"] == undefined) {
      row_to_return.layout["sm"] = [];
    }
    if (row_to_return.linked_elements == undefined) {
      row_to_return.linked_elements = {};
    }

    row_to_return.content.push(
      {
        id: "class",
        type: "string",
        content: this.ordinary_class.toString(),
      },
      {
        id: "class_sm",
        type: "string",
        content:
          getCurrentElement("class") + ": " + this.ordinary_class.toString(),
      }
    );
    (row_to_return.layout["xl"] as (string | number)[]).push("class");
    (row_to_return.layout["sm"] as LayoutElement[][]).push([
      {
        id: "class_sm",
      },
    ]);

    if (this.learning_context_id != undefined) {
      row_to_return.content.push(
        {
          id: "learning_context",
          type: "string",
          content: this.learning_context_id,
        },
        {
          id: "learning_context_sm",
          type: "string",
          content:
            getCurrentElement("learning_context") +
            ": " +
            this.learning_context_id,
        }
      );

      (row_to_return.layout["xl"] as (string | number)[]).push(
        "learning_context"
      );
      (row_to_return.layout["sm"] as LayoutElement[][]).push([
        {
          id: "learning_context_sm",
        },
      ]);
    }
    if (grades) {
      tmp_content = {
        event: "grades",
        data: {
          title: this.name + " " + this.surname,
          parameters: {
            course_id: this.associated_project_class_id.course_id,
            session_id: this.associated_project_class_id.session_id,
            student_id: this.id,
            teacher_id: teacher_id,
          },
        },
        icon: getIcon("document_text"),
      };
      actual_final_grade =
        final_grade != undefined ? "" + final_grade.grade : "-";

      row_to_return.content.push(
        {
          id: "grades", // TODO (4): Mettere il controllo con future_course al passaggio a curriculum_v2
          type: "icon",
          linkType: "event",
          content: tmp_content,
        },
        {
          id: "final_grade",
          type: "string",
          content: actual_final_grade,
        },
        getCustomMessage(
          "final_grade_sm",
          getCurrentElement("final_grade") + ": " + actual_final_grade,
          "string"
        ),
        {
          id: "grades_sm",
          type: "string_icon",
          linkType: "event",
          content: Object.assign(tmp_content, {
            text: getCurrentElement("grades"),
            whole_link: true,
          }),
          ...store.state.button_css,
        }
      );

      (row_to_return.layout["xl"] as (string | number)[]).push(
        "grades",
        "final_grade"
      );
      (row_to_return.layout["sm"] as LayoutElement[][]).push(
        [
          {
            id: "final_grade_sm",
            size: "auto",
          },
        ],
        [
          {
            id: "grades_sm",
            size: "auto",
          },
        ]
      );

      row_to_return.linked_elements = Object.assign(
        row_to_return.linked_elements,
        {
          final_grade: ["final_grade", "final_grade_sm"],
        }
      );
    } else if (linked_input) {
      tmp_len = row_to_return.content.length;
      row_to_return.content.push(
        {
          id: "grade",
          type: "input",
          content: "",
          params: {
            ref: {
              id: this.id,
              index: tmp_len,
            },
            type: "number",
          },
        },
        {
          id: "grade_sm",
          type: "input",
          content: "",
          params: {
            ref: {
              id: this.id,
              index: tmp_len + 1,
            },
            type: "number",
            label: getCurrentElement("grade"),
          },
        }
      );

      (row_to_return.layout["xl"] as (string | number)[]).push("grade");
      (row_to_return.layout["sm"] as LayoutElement[][]).push([
        {
          id: "grade_sm",
        },
      ]);

      row_to_return.linked_elements = Object.assign(
        row_to_return.linked_elements,
        {
          grade: ["grade", "grade_sm"],
        }
      );
    } else if (final_confirmation == undefined) {
      tmp_content = {
        event: "student_mover",
        data: {
          title: this.name + " " + this.surname,
          parameters: {
            student_id: this.id,
            ordinary_class: this.ordinary_class,
          },
        },
        icon: getIcon("pencil"),
      };
      row_to_return.content.push(
        {
          id: "student_mover",
          type: "icon",
          linkType: "event",
          content: tmp_content,
        },
        {
          id: "student_mover_sm",
          type: "string_icon",
          linkType: "event",
          content: Object.assign(tmp_content, {
            text: getCurrentElement("move"),
            whole_link: true,
          }),
          ...store.state.button_css,
        }
      );

      tmp_content = {
        event: "remove_student",
        data: {
          title: this.name + " " + this.surname,
          parameters: {
            student_id: this.id,
          },
        },
        icon: getIcon("close"),
      };
      row_to_return.content.push(
        {
          id: "remove_student",
          type: "icon",
          linkType: "event",
          content: tmp_content,
        },
        {
          id: "remove_student_sm",
          type: "string_icon",
          linkType: "event",
          content: Object.assign(tmp_content, {
            text: getCurrentElement("remove"),
            whole_link: true,
          }),
          ...store.state.button_css,
        },
        getCustomMessage("empty", "")
      );

      (row_to_return.layout["xl"] as (string | number)[]).push(
        "student_mover",
        "remove_student"
      );
      row_to_return.layout["sm"] = (
        row_to_return.layout["sm"] as LayoutElement[][]
      ).concat([
        [
          {
            id: "student_mover_sm",
            size: "5",
          },
          {
            id: "empty",
            size: "2",
          },
          {
            id: "remove_student_sm",
            size: "5",
          },
        ],
      ]);

      row_to_return.linked_elements = Object.assign(
        row_to_return.linked_elements,
        {
          student_mover: ["student_mover", "student_mover_sm"],
          remove_student: ["remove_student", "remove_student_sm"],
        }
      );
    }

    return row_to_return;
  }
}

class StudentInformation extends StudentSummary {
  username: string;
  gender?: Gender;
  birth_date?: Date;
  address?: string;
  email: string;
  ordinary_class: OrdinaryClassSummary;

  constructor(props: StudentInformationProps) {
    super(props);
    this.username = props.username;
    this.gender = props.gender as Gender;
    this.birth_date = props.birth_date ? new Date(props.birth_date) : undefined;
    this.address = props.address;
    this.email = props.email;

    const tmp_class = props.ordinary_class_ref.data as {
      study_address: string;
      study_year: number;
      section: string;
    };
    this.ordinary_class = new OrdinaryClassSummary({
      study_year: tmp_class.study_year,
      address: tmp_class.study_address,
      section: props.class_section,
    });
  }

  toCard(): GeneralCardElements {
    return {
      id: "" + this.username,
      title: getCustomMessage("title", this.username, "title"),
      group: "",
      content: [
        {
          id: this.id + "_name",
          type: "string",
          content: getCurrentElement("name") + ": " + this.name,
        },
        {
          id: this.id + "_surname",
          type: "string",
          content: getCurrentElement("surname") + ": " + this.surname,
        },
        {
          id: this.id + "_gender",
          type: "string",
          content:
            getCurrentElement("gender") +
            ": " +
            (this.gender != undefined ? getGender(this.gender) : "-"),
        },
        {
          id: this.id + "_birth_date",
          type: "string",
          content:
            getCurrentElement("birth_date") +
            ": " +
            (this.birth_date != undefined && !isNaN(this.birth_date.getTime())
              ? toDateString(this.birth_date)
              : "-"),
        },
        {
          id: this.id + "_address",
          type: "string",
          content: getCurrentElement("address") + ": " + (this.address ?? "-"),
        },
        {
          id: this.id + "_email",
          type: "string",
          content: getCurrentElement("email") + ": " + this.email,
        },
        {
          id: this.id + "_class",
          type: "string",
          content:
            getCurrentElement("class") + ": " + this.ordinary_class.toString(),
        },
      ],
    };
  }
}

type LearningContextSummary = {
  id: string;
  credits?: number | null;
};

type LearningContext = LearningContextSummary & TitleDescription;

type AnnouncementSummaryProps = {
  id: number;
  publishment: Date;
} & {
  [key in keyof Language as `${Language}_title`]: string;
};

type Announcement = AnnouncementSummaryProps & {
  [key in keyof Language as `${Language}_message`]: string;
};

class AnnouncementSummary implements AnnouncementSummaryProps {
  id: number;
  publishment: Date;
  italian_title: string;
  english_title: string;

  constructor(props: AnnouncementSummaryProps) {
    this.id = props.id;
    this.publishment = new Date(props.publishment);
    this.italian_title = props.italian_title;
    this.english_title = props.english_title;
  }

  toCard(): GeneralCardElements {
    const language = getCurrentLanguage();
    return {
      id: "" + this.id,
      group: "",
      title: {
        id: this.id + "_title",
        type: "title",
        linkType: "event",
        content: {
          event: "announcement",
          data: {
            title: this[`${language}_title`],
            announcement_id: this.id,
          },
          text: this[`${language}_title`],
        },
        classes: {
          label: {
            "ion-padding-start": true,
            "ion-padding-bottom": true,
          },
        },
      },
      content: [
        {
          id: this.id + "_publishment",
          type: "string",
          content: toDateString(this.publishment),
          colors: {
            background: {
              name: "white",
              type: "var",
            },
          },
          classes: {
            label: {
              "ion-margin-horizontal": true,
            },
          },
        },
      ],
      colors: {
        background: {
          name: "announcements",
          type: "var",
        },
      },
    };
  }
}

type AnnouncementParameters = {
  course_id: number;
  session_id: number;
  sections: string[];
  current_section_index: number;
  teacher_id?: number;
};

type Gender = "M" | "F" | "O";

const GenderKeys: {
  [key in keyof string as Gender]: string;
} = {
  M: "male",
  F: "female",
  O: "other",
};

type AlternateList<T> = {
  [key: string]: TmpList<T> | T;
};

type TmpList<T = any> = {
  [key: string | number]: T;
};

type Progression = {
  learning_area_ref: ResponseItem<{
    id: string | null;
  }>;
  learning_context_ref: ResponseItem<{
    id: string;
  }>;
  credits: string;
  max_credits: number;
};

type LoginInformation = {
  type: UserType;
  parameters: {
    [key: string]: string;
  };
};

type UserType = "student" | "teacher" | "admin";

type UserSubType = "tutor";

type LoginResponse = {
  success: boolean;
  message: string;
};

type SuccessLoginResponse = LoginResponse & {
  user: UserType;
  token: string;
  username: string;
  id: number;
};

type UserSummaryProps = {
  id: number;
  user: UserType;
};

type UserProps = UserSummaryProps & {
  username: string;
  token: string;
  refresh_token?: string;
  expirationDate: string;
  // TODO (4): mettere first_access
};

class UserSummary {
  [key: string]: any;

  private _id: number;
  private _type: UserType;
  private _subtype?: UserSubType;

  constructor(props: UserSummaryProps, subtype?: UserSubType) {
    this._id = props.id;
    this._type = props.user;
    this._subtype = subtype;
  }

  public get id(): number {
    return this._id;
  }

  public get type(): UserType {
    return this._type;
  }

  public get subtype(): UserSubType | undefined {
    return this._subtype;
  }

  static getProperties() {
    return ["id", "type", "subtype"];
  }
}

class User extends UserSummary {
  private _username: string;
  private _token: string;
  private _refresh_token?: string;
  private _expiration_date: Date;

  constructor(props: UserProps, subtype?: UserSubType) {
    super(props, subtype);
    this._username = props.username;
    this._token = props.token;
    this._refresh_token = props.refresh_token;
    this._expiration_date = new Date(props.expirationDate);
  }

  public get username(): string {
    return this._username;
  }

  public get token(): string {
    return this._token;
  }

  public set token(new_token: string) {
    this._token = new_token;
  }

  public get refresh_token(): string | undefined {
    return this._refresh_token;
  }

  public set refresh_token(new_refresh_token: string | undefined) {
    this._refresh_token = new_refresh_token;
  }

  public set expiration_date(new_expiration: Date) {
    this._expiration_date = new_expiration;
  }

  public get expiration_date(): Date {
    return this._expiration_date;
  }

  static getProperties() {
    return super
      .getProperties()
      .concat(["username", "token", "refresh_token", "expiration_date"]);
  }

  static getLoggedUser() {
    const session = window.sessionStorage;
    const user: User | undefined = store.state.user;

    if (user != undefined) {
      return user;
    } else if (session.getItem("id") != undefined) {
      return new User(
        {
          id: parseInt(session.getItem("id") as string),
          username: session.getItem("username") as string,
          token: session.getItem("token") as string,
          refresh_token: session.getItem("refresh_token") ?? undefined,
          user: session.getItem("type") as UserType,
          expirationDate: session.getItem("expiration_date") as string,
        },
        session.getItem("subtype") as UserSubType
      );
    } else {
      return undefined;
    }
  }
}

type CourseModelProps = {
  course_ref: ResponseItem<{
    id: number;
  }>;
  creation_school_year: number;
  learning_session_id: number | null;
  project_class_confirmation_date: string | null;
  project_class_to_be_modified: boolean | null;
  course_confirmation_date: string | null;
  course_to_be_modified: boolean | null;
  certifying_admin_ref: ResponseItem<{
    id: number;
  }> | null;
  admin_name: string | null;
  admin_surname: string | null;
  proposer_teacher_ref: ResponseItem<{
    // TODO (9): raccogliere ref, name e surname in un unico type
    id: number;
  }> | null;
  teacher_name: string | null;
  teacher_surname: string | null;
  preferences: number | null;
} & {
  [key in keyof string as `${Language}_title`]: string;
};

class CourseModel {
  id: number;
  creation_school_year: number;
  learning_session?: LearningSessionSummary;
  italian_title: string;
  english_title: string;
  project_class_confirmation_date?: Date;
  project_class_to_be_modified?: boolean;
  course_confirmation_date?: Date;
  course_to_be_modified?: boolean;
  certifying_admin?: AdminSummary;
  proposer_teacher?: TeacherSummary;
  preferences?: number;

  constructor(props: CourseModelProps, learning_session?: LearningSession) {
    this.id = (props.course_ref.data as { id: number }).id;
    this.learning_session =
      learning_session ??
      (props.learning_session_id != undefined
        ? new LearningSessionSummary({
            id: props.learning_session_id,
            number: -1,
            school_year: -1,
          })
        : undefined);
    this.italian_title = props.italian_title;
    this.english_title = props.english_title;
    this.creation_school_year = props.creation_school_year;
    this.project_class_confirmation_date =
      props.project_class_confirmation_date != null
        ? new Date(props.project_class_confirmation_date)
        : undefined;
    this.project_class_to_be_modified =
      props.project_class_to_be_modified ?? undefined;
    this.course_confirmation_date =
      props.course_confirmation_date != null
        ? new Date(props.course_confirmation_date)
        : undefined;
    this.course_to_be_modified = props.course_to_be_modified ?? undefined;
    this.proposer_teacher =
      props.proposer_teacher_ref != undefined &&
      props.teacher_name != undefined &&
      props.teacher_surname != undefined
        ? new TeacherSummary({
            id: (props.proposer_teacher_ref.data as { id: number }).id,
            name: props.teacher_name,
            surname: props.teacher_surname,
          })
        : undefined; // Project class
    this.certifying_admin =
      props.certifying_admin_ref != null &&
      props.admin_name != null &&
      props.admin_surname != null
        ? new AdminSummary({
            id: (props.certifying_admin_ref.data as { id: number }).id,
            name: props.admin_name,
            surname: props.admin_surname,
          })
        : undefined; // Project class
    this.preferences = props.preferences ?? undefined;
  }

  async loadParms() {
    if (this.learning_session) {
      this.learning_session = await executeLink(
        "/v1/learning_sessions/" + this.learning_session.id,
        (response) => new LearningSessionSummary(response.data.data)
      ); // TODO (4): mettere alternativa dove vengono passati i parametri al costruttore per diminuire il numero di richieste
    }
  }

  isApproved() {
    return (
      this.course_confirmation_date instanceof Date &&
      !isNaN(this.course_confirmation_date.getMilliseconds()) &&
      (this.learning_session == undefined ||
        (this.project_class_confirmation_date instanceof Date &&
          !isNaN(this.project_class_confirmation_date.getMilliseconds())))
    );
  }

  toString() {
    const language = getCurrentLanguage();
    return (
      this[`${language}_title`] +
      " - " +
      getCompleteSchoolYear(this.creation_school_year)
    );
  }

  toCard(user: User, view = false): GeneralCardElements {
    // TODO (5): evidenziare quando project_class_to_be_modified | course_to_be_modified
    const language = getCurrentLanguage();

    let project_class = "<label>" + getCurrentElement("project_class") + ":";

    const card: GeneralCardElements = {
      id:
        this.id +
        "_" +
        this.creation_school_year +
        (this.learning_session != undefined
          ? "_" + this.learning_session.id
          : ""),
      group: "",
      title: getCustomMessage(
        "title",
        this[`${language}_title`] + " - " + this.creation_school_year,
        "title"
      ),
      subtitle:
        this.learning_session != undefined
          ? getCustomMessage(
              "subtitle",
              getCurrentElement("session") +
                ": " +
                this.learning_session.number +
                " - " +
                this.learning_session.school_year
            )
          : undefined,
      content: [
        {
          id: this.id + "_course_confirmation_date",
          type: "string",
          content:
            getCurrentElement("course_confirmation_date") +
            ": " +
            (this.course_confirmation_date != undefined
              ? toDateString(this.course_confirmation_date)
              : "-"),
        },
      ],
      link: {
        url:
          "/course_proposal?" +
          (view
            ? "view=" +
              this.id +
              (this.learning_session != undefined
                ? "_" + this.learning_session.id
                : "")
            : ""), // TODO (6*): mettere guardia che sistema il link, salvando le cose sulla sessione
        method: "get",
      },
    };

    if (user.type != "teacher") {
      card.content?.push({
        id: this.id + "_proposer_teacher",
        type: "string",
        content:
          getCurrentElement("proposer_teacher") +
          ": " +
          (this.proposer_teacher != undefined
            ? this.proposer_teacher.surname + " " + this.proposer_teacher.name
            : "-"),
      });
    }
    if (this.learning_session != undefined && card.content != undefined) {
      if (
        this.certifying_admin != undefined &&
        this.project_class_confirmation_date != undefined
      ) {
        project_class +=
          "</label><ul class='ion-no-margin'><li>" +
          getCurrentElement("confirmation_date") +
          ": " +
          toDateString(this.project_class_confirmation_date) +
          "</li>" +
          "<li>" +
          getCurrentElement("certifying_admin") +
          ": " +
          this.certifying_admin.surname +
          " " +
          this.certifying_admin.surname +
          "</li>" +
          "<li>" +
          getCurrentElement("additional_preferences") +
          ": " +
          (this.preferences != undefined ? this.preferences : "0") +
          "</li></ul>";
      } else {
        project_class += " " + getCurrentElement("not_confirmed") + "</label>";
      }
      card.content.push({
        id: this.id + "_project_class",
        type: "html",
        content: project_class,
      });
    }

    return card;
  }
}

type PagesType = "pages" | "editor" | "no_inner_props" | "different_request";

type Pages =
  | "course_id"
  | "title"
  | "characteristics1"
  | "characteristics2"
  | "description"
  | "expected_learning_results"
  | "criterions"
  | "activities"
  | "access_object"
  | "images_list"
  | "specific_information";

type PropositionKeysType = "required" | "optional" | "lists";

type PropositionListsKeys =
  | "access_object"
  | "teaching_list"
  | "growth_list"
  | "images_list"
  | "teacher_list";

type PropositionRequiredKeys =
  | PropositionListsKeys
  | "italian_title"
  | "italian_descr"
  | "up_hours"
  | "credits"
  | "italian_exp_l"
  | "italian_cri"
  | "italian_act"
  | "area_id"
  | "min_students"
  | "max_students"
  | "session_id"
  | "project_class_code"
  | "class_group"
  | "num_section";

type PropositionOptionalKeys =
  | "english_title"
  | "english_descr"
  | "english_exp_l"
  | "english_cri"
  | "english_act";

type PropositionKeys =
  | PropositionRequiredKeys
  | PropositionOptionalKeys
  | "course_id";

type PropositionActions = "view" | "edit" | "propose";

type PropositionTitles = {
  [key in keyof string as `${Language}_title`]: string;
};

type PropositionCharacteristics1 = {
  up_hours: number;
  credits: number;
  area_id: string;
  min_students: number;
  max_students: number;
};

type PropositionCharacteristics2 = {
  growth_list: number[];
  teaching_list: string[];
};

type PropositionDescription = {
  [key in keyof string as `${Language}_descr`]: string;
};

type PropositionExpectedLearningResults = {
  [key in keyof string as `${Language}_exp_l`]: string;
};

type PropositionCriterions = {
  [key in keyof string as `${Language}_cri`]: string;
};

type PropositionActivities = {
  [key in keyof string as `${Language}_act`]: string;
};

type AccessObject = {
  study_year: number;
  study_address: string;
  main_study_year: boolean;
  presidium: boolean;
};

type PropositionAccessObject = {
  [key: string]: AccessObject[];
};

type PropositionImage = File;

type PropositionTeacher = {
  teacher_id: number;
  main: boolean;
  sections: string[];
};

type PropositionSpecificInformation = {
  session_id: number;
  project_class_code: string;
  class_group: number;
  num_section: number;
  teacher_list: PropositionTeacher[];
};

type PropositionObj = {
  [key in keyof string as PropositionKeys]: any;
} & {
  course_id: number;
  access_object: PropositionAccessObject;
  images_list?: PropositionImage[];
} & PropositionTitles &
  PropositionCharacteristics1 &
  PropositionCharacteristics2 &
  PropositionDescription &
  PropositionExpectedLearningResults &
  PropositionCriterions &
  PropositionActivities &
  PropositionSpecificInformation;

type PagesTitlesRefs = {
  [key in keyof string as Pages]: string;
};

class ModelProposition {
  [key: string]: any;

  private _course_id?: number;
  private _title: PropositionTitles;
  private _characteristics1: PropositionCharacteristics1;
  private _characteristics2: PropositionCharacteristics2;
  private _description: PropositionDescription;
  private _expected_learning_results: PropositionExpectedLearningResults;
  private _criterions: PropositionCriterions;
  private _activities: PropositionActivities;
  private _access_object: PropositionAccessObject;
  private _images_list: PropositionImage[];
  private _specific_information: PropositionSpecificInformation;
  private _remaining: Pages[];

  constructor(proposition?: PropositionObj) {
    const actual_proposition =
      proposition ?? ModelProposition.emptyProposition();
    const empty_proposition = proposition != undefined;

    this._course_id = actual_proposition.course_id;
    this._title = {
      italian_title: actual_proposition.italian_title,
      english_title: actual_proposition.english_title,
    };
    this._characteristics1 = {
      up_hours: actual_proposition.up_hours,
      credits: actual_proposition.credits,
      area_id: actual_proposition.area_id,
      min_students: actual_proposition.min_students,
      max_students: actual_proposition.max_students,
    };
    this._characteristics2 = {
      growth_list: actual_proposition.growth_list,
      teaching_list: actual_proposition.teaching_list,
    };
    this._description = {
      italian_descr: actual_proposition.italian_descr,
      english_descr: actual_proposition.english_descr,
    };
    this._expected_learning_results = {
      italian_exp_l: actual_proposition.italian_exp_l,
      english_exp_l: actual_proposition.english_exp_l,
    };
    this._criterions = {
      italian_cri: actual_proposition.italian_cri,
      english_cri: actual_proposition.english_cri,
    };
    this._activities = {
      italian_act: actual_proposition.italian_act,
      english_act: actual_proposition.english_act,
    };
    this._access_object = actual_proposition.access_object;
    this._images_list = actual_proposition.images_list ?? [];
    this._specific_information = {
      session_id: actual_proposition.session_id,
      project_class_code: actual_proposition.project_class_code,
      class_group: actual_proposition.class_group,
      num_section: actual_proposition.num_section,
      teacher_list: actual_proposition.teacher_list,
    };

    if (empty_proposition) {
      this._remaining = ModelProposition.getProps();
    } else {
      this._remaining = []; // TODO (4): check remaining (usare sessione per persistenza)
    }
  }

  public static emptyProposition(): PropositionObj {
    return {
      course_id: 0, // TODO (4): mettere undefined di base a quelli che possono permetterselo
      italian_title: "",
      english_title: "",
      up_hours: 0,
      credits: 0,
      area_id: "",
      growth_list: [],
      session_id: -1,
      project_class_code: "",
      class_group: -1,
      num_section: 1,
      min_students: 0,
      max_students: 0,
      teaching_list: [],
      italian_descr: "",
      english_descr: "",
      italian_exp_l: "",
      english_exp_l: "",
      italian_cri: "",
      english_cri: "",
      italian_act: "",
      english_act: "",
      access_object: {},
      images_list: undefined,
      teacher_list: [],
    };
  }

  public get course_id() {
    return this._course_id;
  }
  public set course_id(value: number | undefined) {
    this._course_id = value;
    this._remaining = this._remaining.filter((a) => a != "course_id");
  }

  public get title() {
    return this._title;
  }
  public set title(value: PropositionTitles) {
    this._title = value;
    this._remaining = this._remaining.filter((a) => a != "title");
  }

  public get characteristics1() {
    return this._characteristics1;
  }
  public set characteristics1(value: PropositionCharacteristics1) {
    this._characteristics1 = value;
    this._remaining = this._remaining.filter((a) => a != "characteristics1");
  }

  public get characteristics2() {
    return this._characteristics2;
  }
  public set characteristics2(value: PropositionCharacteristics2) {
    this._characteristics2 = value;
    this._remaining = this._remaining.filter((a) => a != "characteristics2");
  }

  public get description() {
    return this._description;
  }
  public set description(value: PropositionDescription) {
    this._description = value;
    this._remaining = this._remaining.filter((a) => a != "description");
  }

  public get expected_learning_results() {
    return this._expected_learning_results;
  }
  public set expected_learning_results(
    value: PropositionExpectedLearningResults
  ) {
    this._expected_learning_results = value;
    this._remaining = this._remaining.filter(
      (a) => a != "expected_learning_results"
    );
  }

  public get criterions() {
    return this._criterions;
  }
  public set criterions(value: PropositionCriterions) {
    this._criterions = value;
    this._remaining = this._remaining.filter((a) => a != "criterions");
  }

  public get activities() {
    return this._activities;
  }
  public set activities(value: PropositionActivities) {
    this._activities = value;
    this._remaining = this._remaining.filter((a) => a != "activities");
  }

  public get access_object() {
    return this._access_object;
  }
  public set access_object(value: PropositionAccessObject) {
    this._access_object = value;
    this._remaining = this._remaining.filter((a) => a != "access_object");
  }

  public get images_list() {
    return this._images_list;
  }
  public set images_list(value: PropositionImage[]) {
    this._images_list = value;
    this._remaining = this._remaining.filter((a) => a != "images_list");
  }

  public get specific_information() {
    return this._specific_information;
  }
  public set specific_information(value: PropositionSpecificInformation) {
    this._specific_information = {
      session_id: value.session_id,
      project_class_code: value.project_class_code,
      class_group: value.class_group,
      num_section: value.num_section,
      teacher_list: value.teacher_list.map((a) => {
        return {
          teacher_id: a.teacher_id,
          main: /*!!*/ a.main ? true : false,
          sections: a.sections,
        };
      }),
    };
    this._remaining = this._remaining.filter(
      (a) => a != "specific_information"
    );
  }

  toProposition(remove_different_request = true): PropositionObj {
    const proposition: {
      [key: string]: any;
    } = {};
    const keys = Object.keys(this).filter(
      (a) =>
        a != "_remaining" &&
        (a != "course_id" || this.course_id != 0) &&
        (!remove_different_request ||
          ModelProposition.getProps("different_request").findIndex(
            (b) => b == a
          ) == -1)
    );

    let inner_keys: string[];

    for (const page of keys) {
      if (
        ModelProposition.getProps("no_inner_props").findIndex(
          (a) => a == page.slice(1)
        ) == -1
      ) {
        inner_keys = Object.keys(this[page]);
        for (const key of inner_keys) {
          proposition[key] = this[page][key];
        }
      } else {
        proposition[page.slice(1)] = this[page];
      }
    }

    return proposition as PropositionObj;
  }

  isComplete() {
    return this._remaining.length == 0;
  }

  public get remaining(): string[] {
    return this._remaining;
  }

  static getProps(type?: PagesType): Pages[] {
    switch (type) {
      case undefined:
        return [
          "course_id",
          "title",
          "characteristics1",
          "characteristics2",
          "description",
          "expected_learning_results",
          "criterions",
          "activities",
          "access_object",
          "images_list",
          "specific_information",
        ];
      case "pages":
        return [
          "title",
          "characteristics1",
          "characteristics2",
          "description",
          "expected_learning_results",
          "criterions",
          "activities",
          "access_object",
          "images_list",
          "specific_information",
        ];
      case "editor":
        return [
          "description",
          "expected_learning_results",
          "criterions",
          "activities",
        ];
      case "no_inner_props":
        return ["course_id", "access_object", "images_list"];
      case "different_request":
        return ["images_list"];
    }
  }

  static getTitles(): PagesTitlesRefs {
    return {
      course_id: "reference_model",
      title: "title",
      characteristics1: "characteristics",
      characteristics2: "characteristics",
      description: "description",
      expected_learning_results: "expected_learning_results",
      criterions: "criterions",
      activities: "activities",
      access_object: "access_object",
      images_list: "course_images",
      specific_information: "specific_information",
    };
  }

  static getPageIndex(page: Pages) {
    return ModelProposition.getProps().findIndex((a) => a == page);
  }

  getKeyIndex(key: PropositionKeys) {
    const pages = ModelProposition.getProps("pages");

    let index: number;
    let count = 0;

    if ((index = pages.findIndex((a) => a == key)) == -1) {
      while (index == -1 && count < pages.length) {
        if (key in (this[pages[count]] as object)) {
          index = count;
        }
        count++;
      }
    }

    return index;
  }

  static getPropositionProps(type: PropositionKeysType): PropositionKeys[] {
    const lists: PropositionListsKeys[] = [
      "access_object",
      "teaching_list",
      "growth_list",
      "images_list",
      "teacher_list",
    ];

    let keys: PropositionKeys[];

    switch (type) {
      case "required":
        keys = lists;
        keys.push(
          "italian_title",
          "italian_descr",
          "up_hours",
          "credits",
          "italian_exp_l",
          "italian_cri",
          "italian_act",
          "area_id",
          "min_students",
          "max_students",
          "session_id",
          "project_class_code",
          "class_group",
          "num_section"
        );
        break;
      case "optional":
        keys = [
          "english_title",
          "english_descr",
          "english_exp_l",
          "english_cri",
          "english_act",
        ];
        break;
      default:
        keys = [];
        break;
    }

    return keys;
  }

  static getRequiredInformation(): {
    [key in keyof string as PropositionRequiredKeys]: {
      rule: boolean | number[] | ((proposition: PropositionObj) => boolean);
      error_message: string;
      valid: PropositionActions[];
    }[];
  } {
    return {
      italian_title: [
        {
          rule: true,
          error_message: getCurrentElement("missing_italian_title"),
          valid: ["propose", "edit"],
        },
      ],
      italian_descr: [
        {
          rule: true,
          error_message: getCurrentElement("missing_italian_description"),
          valid: ["propose", "edit"],
        },
      ],
      up_hours: [
        {
          rule: [0],
          error_message: getCurrentElement("up_hours_error"),
          valid: ["propose", "edit"],
        },
      ],
      credits: [
        {
          rule: [1],
          error_message: getCurrentElement("credits_error"),
          valid: ["propose", "edit"],
        },
      ],
      italian_exp_l: [
        {
          rule: true,
          error_message: getCurrentElement(
            "missing_italian_expected_learning_results"
          ),
          valid: ["propose", "edit"],
        },
      ],
      italian_cri: [
        {
          rule: true,
          error_message: getCurrentElement("missing_italian_criterions"),
          valid: ["propose", "edit"],
        },
      ],
      italian_act: [
        {
          rule: true,
          error_message: getCurrentElement("missing_italian_activities"),
          valid: ["propose", "edit"],
        },
      ],
      area_id: [
        {
          rule: true,
          error_message: getCurrentElement("missing_area_id"),
          valid: ["propose", "edit"],
        },
      ],
      growth_list: [
        {
          rule: [1],
          error_message: getCurrentElement("missing_growth_areas"),
          valid: ["propose", "edit"],
        },
      ],
      min_students: [
        {
          rule: [1],
          error_message: getCurrentElement("students_error"),
          valid: ["propose", "edit"],
        },
      ],
      max_students: [
        {
          rule: [1],
          error_message: getCurrentElement("students_error"),
          valid: ["propose", "edit"],
        },
        {
          rule: (proposition: PropositionObj) =>
            proposition.max_students - proposition.min_students >= 6, // TODO (6): Attenzione, diverso da backend. Sistemare con settings comuni
          error_message: getCurrentElement("min_max_error"),
          valid: ["propose"],
        },
        {
          rule: (proposition: PropositionObj) =>
            proposition.max_students - proposition.min_students > 0,
          error_message: getCurrentElement("max_greater_min_error"),
          valid: ["edit"],
        },
      ],
      session_id: [
        {
          rule: [1],
          error_message: getCurrentElement("missing_session_id"),
          valid: ["propose", "edit"],
        },
      ],
      project_class_code: [
        {
          rule: [8, 9],
          error_message: getCurrentElement("project_class_code_error"),
          valid: ["propose", "edit"],
        },
      ],
      access_object: [
        {
          rule: [1],
          error_message: getCurrentElement("missing_access"),
          valid: ["propose", "edit"],
        },
      ],
      teaching_list: [
        {
          rule: [1, 4],
          error_message: getCurrentElement("teaching_error"),
          valid: ["propose", "edit"],
        },
      ],
      class_group: [
        {
          rule: [1],
          error_message: getCurrentElement("missing_class_group"),
          valid: ["propose", "edit"],
        },
      ],
      num_section: [
        {
          rule: [1],
          error_message: getCurrentElement("num_sections_error"),
          valid: ["propose", "edit"],
        },
      ],
      images_list: [
        {
          rule: [0, 5],
          error_message: getCurrentElement("max_images_error"),
          valid: ["propose", "edit"],
        },
      ],
      teacher_list: [
        {
          rule: [1],
          error_message: getCurrentElement("missing_teachers"),
          valid: ["propose", "edit"],
        },
      ],
    };
  }

  check(action: PropositionActions) {
    const required_information = ModelProposition.getRequiredInformation(); // TODO (5): trovare un modo per dare un ordine
    const proposition = this.toProposition();
    const missing_information: {
      [key in keyof string as PropositionRequiredKeys]?: string; // TODO (6): mettere messaggi multipli per singolo campo
    } = {};

    let len: number;
    let actual_number: number;

    for (const key of Object.keys(
      required_information
    ) as PropositionRequiredKeys[]) {
      for (const rule of required_information[key]) {
        if (rule.valid.findIndex((a) => a == action) != -1) {
          if (typeof rule.rule == "boolean") {
            if (proposition[key] == undefined || proposition[key] == "") {
              missing_information[key] = rule.error_message;
            }
          } else if (Array.isArray(rule.rule)) {
            len = (rule.rule as number[]).length;
            if (
              Array.isArray(proposition[key]) ||
              typeof proposition[key] == "string"
            ) {
              if (
                !(
                  proposition[key].length >= (rule.rule as number[])[0] &&
                  (len == 1 ||
                    proposition[key].length < (rule.rule as number[])[1])
                )
              ) {
                missing_information[key] = rule.error_message;
              }
            } else if (
              typeof proposition[key] == "number" ||
              (typeof proposition[key] == "string" &&
                (!isNaN(Number(proposition[key])) ||
                  !isNaN(parseFloat(proposition[key]))))
            ) {
              actual_number =
                typeof proposition[key] == "number"
                  ? proposition[key]
                  : !isNaN(Number(proposition[key]))
                  ? parseInt(proposition[key])
                  : parseFloat(proposition[key]);
              if (actual_number < (rule.rule as number[])[0]) {
                missing_information[key] = rule.error_message;
              }
            } else if (key == "access_object") {
              if (
                Object.keys(proposition[key]).length <
                (rule.rule as number[])[0]
              ) {
                missing_information[key] = rule.error_message;
              }
            }
          } else {
            if (!rule.rule(proposition)) {
              missing_information[key] = rule.error_message;
            }
          }
        }
      }
    }

    return missing_information;
  }
}

type TitleDescription = {
  [key in keyof string as `${Language}_title`]: string;
} & {
  [key in keyof string as `${Language}_description`]?: string; // TODO (4): vedere descrizioni che possono essere null
};

type GrowthAreaProps = {
  id?: number;
  growth_area_ref?: ResponseItem<{ id: number }>;
} & TitleDescription;

class GrowthArea {
  id: number;
  italian_title: string;
  english_title: string;
  italian_description?: string;
  english_description?: string;

  constructor(props: GrowthAreaProps) {
    this.id =
      props.growth_area_ref != undefined
        ? (props.growth_area_ref.data as { id: number }).id
        : (props.id as number);
    this.italian_title = props.italian_title;
    this.english_title = props.english_title;
    this.italian_description = props.italian_description;
    this.english_description = props.english_description;
  }

  toCard(disabled = false): GeneralCardElements {
    const language = getCurrentLanguage();
    return {
      id: "" + this.id,
      group: "",
      side_element: disabled
        ? undefined
        : {
            id: this.id + "_remove",
            type: "icon",
            linkType: "event",
            content: {
              event: "remove",
              data: {
                id: this.id,
              },
              icon: getIcon("close"),
            },
          },
      content: [
        {
          id: "" + this.id,
          type: "string",
          content: this[`${language}_title`],
        },
      ],
    };
  }
}

type TeachingProps = {
  id?: string;
  teaching_ref?: ResponseItem<{ id: string }>;
} & TitleDescription;

class Teaching {
  id: string;
  italian_title: string;
  english_title: string;
  italian_description?: string;
  english_description?: string;

  constructor(props: TeachingProps) {
    this.id =
      props.teaching_ref != undefined
        ? (props.teaching_ref.data as { id: string }).id
        : (props.id as string);
    this.italian_title = props.italian_title;
    this.english_title = props.english_title;
    this.italian_description = props.italian_description;
    this.english_description = props.english_description;
  }

  toCard(disabled = false): GeneralCardElements {
    const language = getCurrentLanguage();
    return {
      id: this.id,
      group: "",
      side_element: disabled
        ? undefined
        : {
            id: this.id + "_remove",
            type: "icon",
            linkType: "event",
            content: {
              event: "remove",
              data: {
                id: this.id,
              },
              icon: getIcon("close"),
            },
          },
      content: [
        {
          id: this.id,
          type: "string",
          content: this[`${language}_title`],
        },
      ],
    };
  }
}

type StudyAddress = {
  id: string;
  max_classes: number;
} & TitleDescription;

class AccessProposition {
  study_year: number;
  study_address: StudyAddress;
  presidium: boolean;
  main_study_year: boolean;

  constructor(
    study_year: number,
    study_address: StudyAddress,
    presidium: boolean,
    main_study_year: boolean
  ) {
    this.study_year = study_year;
    this.study_address = study_address;
    this.presidium = presidium;
    this.main_study_year = main_study_year;
  }

  toCard(learning_context_id: string, disabled = false): GeneralCardElements {
    const language = getCurrentLanguage();

    return {
      id: this.study_address.id + "_" + this.study_year,
      group: learning_context_id,
      side_element: disabled
        ? undefined
        : {
            id: this.study_address.id + "_remove",
            type: "icon",
            linkType: "event",
            content: {
              event: "remove",
              data: {
                learning_context_id: learning_context_id,
                study_address_id: this.study_address.id,
                study_year: this.study_year,
              },
              icon: getIcon("close"),
            },
          },
      content: [
        {
          id: "class",
          type: "string",
          content:
            this.study_year + " " + this.study_address[`${language}_title`],
        },
        /*{
                    id: "presidium",
                    type: "string",
                    content: getCurrentElement("presidium") + ": " + this.presidium,
                },*/
        {
          id: "main_study_year",
          type: "string",
          content:
            getCurrentElement("main_study_year") +
            ": " +
            (this.main_study_year
              ? getCurrentElement("yes")
              : getCurrentElement("no")),
        },
      ],
    };
  }

  toAccessObj(): AccessObject {
    return {
      study_year: this.study_year,
      study_address: this.study_address.id,
      presidium: this.presidium,
      main_study_year: this.main_study_year,
    };
  }
}

type TeacherProps = {
  id: number;
  cf: string;
  username: string;
  name: string;
  surname: string;
  gender: string;
  birth_date: string;
  address: string;
  email: string;
};

class TeacherSummary {
  id: number;
  name: string;
  surname: string;

  constructor(summary: { id: number; name: string; surname: string }) {
    this.id = summary.id;
    this.name = summary.name;
    this.surname = summary.surname;
  }
}

class Teacher extends TeacherSummary {
  username: string;
  cf?: string;
  surname: string;
  gender?: Gender;
  birth_date?: Date;
  address?: string;
  email?: string;

  constructor(teacher: TeacherProps) {
    super({
      id: teacher.id,
      name: teacher.name,
      surname: teacher.surname,
    });
    this.username = teacher.username;
    this.cf = teacher.cf;
    this.surname = teacher.surname;
    this.gender =
      teacher.gender == "M" || teacher.gender == "F" ? teacher.gender : "O";
    this.birth_date = teacher.birth_date
      ? new Date(teacher.birth_date)
      : undefined;
    this.address = teacher.address;
    this.email = teacher.email;
  }

  toCard(): GeneralCardElements {
    return {
      id: "" + this.username,
      title: getCustomMessage("title", this.username, "title"),
      group: "",
      content: [
        {
          id: this.id + "_name",
          type: "string",
          content: getCurrentElement("name") + ": " + this.name,
        },
        {
          id: this.id + "_surname",
          type: "string",
          content: getCurrentElement("surname") + ": " + this.surname,
        },
        {
          id: this.id + "_gender",
          type: "string",
          content:
            getCurrentElement("gender") +
            ": " +
            (this.gender != undefined ? getGender(this.gender) : "-"),
        },
        {
          id: this.id + "_birth_date",
          type: "string",
          content:
            getCurrentElement("birth_date") +
            ": " +
            (this.birth_date != undefined && !isNaN(this.birth_date.getTime())
              ? toDateString(this.birth_date)
              : "-"),
        },
        {
          id: this.id + "_address",
          type: "string",
          content: getCurrentElement("address") + ": " + (this.address ?? "-"),
        },
        {
          id: this.id + "_email",
          type: "string",
          content: getCurrentElement("email") + ": " + this.email,
        },
      ],
    };
  }
}

class TeacherProposition {
  teacher: TeacherSummary;
  main: boolean;
  sections: string[];

  constructor(
    teacher: TeacherSummary,
    main: boolean,
    sections: boolean[] | string[]
  ) {
    this.teacher = teacher;
    this.main = main;
    this.sections = [];
    for (const key in sections) {
      if (typeof sections[key] == "string") {
        this.sections.push(sections[key] as string);
      } else if (sections[key]) {
        this.sections.push(numberToSection(parseInt(key)));
      }
    }
  }

  toCard(disabled = false): GeneralCardElements {
    const card: GeneralCardElements = {
      // TODO (6): sistemare roba undefined
      id: "" + this.teacher.id,
      group: "",
      side_element: disabled
        ? undefined
        : {
            id: this.teacher.id + "_remove",
            type: "icon",
            linkType: "event",
            content: {
              event: "remove",
              data: {
                id: this.teacher.id,
              },
              icon: getIcon("close"),
            },
          },
      content: [
        {
          id: "name",
          type: "string",
          /*linkType: "event",
          content: {
            event: "teacher_info",
            data: {
              teacher_id: this.teacher.id,
            },
            text: this.teacher.name + " " + this.teacher.surname, // + (this.main ? " [" + getCurrentElement("main_teacher") + "]" : "")
          },*/
          content: this.teacher.name + " " + this.teacher.surname,
        }, // TODO (6): creare info teacher
      ],
    };
    if (store.state.sections_use) {
      card.content?.push({
        id: "sections",
        type: "string",
        content:
          getCurrentElement("sections") + ": " + this.sections.join(", "),
      });
    }
    return card;
  }

  toTeacherObj(): PropositionTeacher {
    return {
      teacher_id: this.teacher.id,
      main: this.main,
      sections: this.sections,
    };
  }
}

type OpenToConstraint = {
  study_year_ref: ResponseItem<{ id: number }>;
  study_address_ref: ResponseItem<{ id: string }>;
  presidium: number;
  main_study_year: number;
  learning_context_ref: ResponseItem<{ id: string }>;
} & {
  [key in keyof string as `${Language}_title`]: string;
};

type ProjectClassSummaryProps = {
  course_id: number;
  learning_session: number;
  group: number;
  project_class_code: string;
} & {
  [key in keyof string as `${Language}_title`]: string;
};

type AdminProjectClassProps = ProjectClassSummaryProps & {
  // TODO (7): cambiare nome, dato che possono accederci tutti
  teacher_ref: ResponseItem<{
    id: number;
  }>;
  teacher_name: string;
  teacher_surname: string;
  admin_ref: ResponseItem<{
    id: number;
  }>;
  admin_name: string;
  admin_surname: string;
  to_be_modified: string | null;
  final_confirmation: string | null;
};

class ProjectClassSummary {
  course_id: number;
  learning_session: LearningSession;
  group: number;
  project_class_code: string;
  italian_title: string;
  english_title: string;

  constructor(
    props: ProjectClassSummaryProps,
    learning_session?: LearningSession
  ) {
    this.course_id = props.course_id;
    this.learning_session =
      learning_session ??
      new LearningSession({
        id: props.learning_session,
        number: -1,
        school_year: -1,
        start: "",
        end: "",
        num_groups: 0,
        open_day: "invalid",
      });
    this.group = props.group;
    this.project_class_code = props.project_class_code;
    this.italian_title = props.italian_title;
    this.english_title = props.english_title;
  }

  async loadParms() {
    await executeLink(
      "/v1/learning_sessions/" + this.learning_session.id,
      (response) => {
        this.learning_session = new LearningSession(response.data.data);
      }
    );
  }

  toCard(
    path?: string,
    section?: string,
    separated_elements = false,
    title_content = false,
    show_project_class_code = true
  ): GeneralCardElements {
    const language = getCurrentLanguage();

    const tmp_card: GeneralCardElements = {
      id:
        "" + this.course_id + "_" + this.learning_session.id + "_" + this.group,
      group: "",
      title:
        !title_content && this[`${language}_title`] != undefined
          ? getCustomMessage(
              "title",
              (show_project_class_code ? this.project_class_code + " - " : "") +
                this[`${language}_title`],
              "title"
            )
          : undefined,
      content: [],
      link:
        path != undefined
          ? {
              url: path,
              method: "get",
            }
          : undefined,
    };

    if (separated_elements) {
      tmp_card.content?.push(
        {
          id: "learning_session",
          type: "html",
          content:
            "<b>" +
            getCurrentElement("session") +
            "</b>: " +
            this.learning_session.number +
            " - " +
            this.learning_session.school_year +
            "/" +
            ((this.learning_session.school_year % store.state.year_module) + 1),
        },
        {
          id: "group",
          type: "html",
          content: "<b>" + getCurrentElement("group") + "</b>: " + this.group,
        }
      );
      if (section != undefined) {
        tmp_card.content?.push({
          id: "section",
          type: "html",
          content: "<b>" + getCurrentElement("section") + "</b>: " + section,
        });
      }
    } else {
      tmp_card.content?.push({
        id: "session_group" + (section != undefined ? "_section" : ""),
        type: "html",
        content:
          "<b>" +
          getCurrentElement("session") +
          " - " +
          getCurrentElement("group") +
          (section != undefined ? " - " + getCurrentElement("section") : "") +
          "</b>: (" +
          this.learning_session.number +
          " - " +
          this.learning_session.school_year +
          "/" +
          ((this.learning_session.school_year % store.state.year_module) + 1) + // TODO (4): modificare tutti gli anni scolastici per la visualizzazione
          ") - " +
          this.group +
          (section != undefined ? " - " + section : ""),
      });
    }
    if (title_content && this[`${language}_title`] != undefined) {
      tmp_card.content?.push({
        id: "title",
        type: "html",
        content:
          "<b>" +
          getCurrentElement("title") +
          "</b>: " +
          this[`${language}_title`],
      });
    }

    return tmp_card;
  }
}

class AdminProjectClass extends ProjectClassSummary {
  teacher_id: number;
  teacher_name: string;
  teacher_surname: string;
  admin_id: number;
  admin_name: string;
  admin_surname: string;
  to_be_modified?: string;
  final_confirmation?: Date;

  constructor(
    props: AdminProjectClassProps,
    learning_session?: LearningSession
  ) {
    super(props, learning_session);
    const tmp_date = new Date(props.final_confirmation ?? "invalid_date");

    this.teacher_id = (props.teacher_ref.data as { id: number }).id; // TODO (5): raccogliere in tipo TeacherSummary
    this.teacher_name = props.teacher_name;
    this.teacher_surname = props.teacher_surname;
    this.admin_id = (props.admin_ref.data as { id: number }).id;
    this.admin_name = props.admin_name;
    this.admin_surname = props.admin_surname;
    this.to_be_modified = props.to_be_modified ?? undefined;
    this.final_confirmation = !isNaN(tmp_date.getTime()) ? tmp_date : undefined;
  }

  async loadParms() {
    await super.loadParms();
  }

  toProjectClassSummary() {
    return new ProjectClassSummary(
      {
        course_id: this.course_id,
        learning_session: this.learning_session.id,
        group: this.group,
        italian_title: this.italian_title,
        english_title: this.english_title,
        project_class_code: this.project_class_code,
      },
      this.learning_session
    );
  }

  toCard(
    path?: string,
    section?: string,
    separated_elements = false,
    title_content = false,
    show_project_class_code = true,
    user?: User
  ): GeneralCardElements {
    // TODO (5): evidenziare quando project_class_to_be_modified | course_to_be_modified
    const tmp_card: GeneralCardElements = super.toCard(
      path,
      section,
      separated_elements,
      title_content,
      show_project_class_code
    );

    tmp_card.content?.push({
      id: "proposer_teacher",
      type: "html",
      content:
        "<b>" +
        getCurrentElement("proposer_teacher") +
        "</b>: " +
        this.teacher_name +
        " " +
        this.teacher_surname,
    });
    if (user == undefined || user.type != "student") {
      tmp_card.content?.push(
        {
          id: "admin",
          type: "html",
          content:
            "<b>" +
            getCurrentElement("certifying_admin") +
            "</b>: " +
            this.admin_name +
            " " +
            this.admin_surname,
        },
        {
          id: "final_confirmation",
          type: "html",
          content:
            "<b>" +
            getCurrentElement("final_confirmation") +
            "</b>: " +
            (this.final_confirmation != undefined
              ? toDateString(this.final_confirmation)
              : "-"),
        }
      );
    }

    return tmp_card;
  }
}

type CardListDescription = {
  title?: CustomElement;
  emptiness_message: CustomElement;
  cards_list: OrderedCardsList;
  on_click?: () => any;
};

class AdminSummary {
  id: number;
  name: string;
  surname: string;

  constructor(summary: { id: number; name: string; surname: string }) {
    this.id = summary.id;
    this.name = summary.name;
    this.surname = summary.surname;
  }
}

type AdminProps = {
  id: number;
  cf: string;
  username: string;
  name: string;
  surname: string;
  gender: string;
  birth_date: string;
  address: string;
  email: string;
};

class Admin extends AdminSummary {
  username: string;
  cf?: string;
  surname: string;
  gender?: Gender;
  birth_date?: Date;
  address?: string;
  email?: string;

  constructor(admin: AdminProps) {
    super({
      id: admin.id,
      name: admin.name,
      surname: admin.surname,
    });
    this.username = admin.username;
    this.cf = admin.cf;
    this.surname = admin.surname;
    this.gender =
      admin.gender == "M" || admin.gender == "F" ? admin.gender : "O";
    this.birth_date = admin.birth_date ? new Date(admin.birth_date) : undefined;
    this.address = admin.address;
    this.email = admin.email;
  }

  toCard(): GeneralCardElements {
    return {
      id: "" + this.username,
      title: getCustomMessage("title", this.username, "title"),
      group: "",
      content: [
        {
          id: this.id + "_name",
          type: "string",
          content: getCurrentElement("name") + ": " + this.name,
        },
        {
          id: this.id + "_surname",
          type: "string",
          content: getCurrentElement("surname") + ": " + this.surname,
        },
        {
          id: this.id + "_gender",
          type: "string",
          content:
            getCurrentElement("gender") +
            ": " +
            (this.gender != undefined ? getGender(this.gender) : "-"),
        },
        {
          id: this.id + "_birth_date",
          type: "string",
          content:
            getCurrentElement("birth_date") +
            ": " +
            (this.birth_date != undefined && !isNaN(this.birth_date.getTime())
              ? toDateString(this.birth_date)
              : "-"),
        },
        {
          id: this.id + "_address",
          type: "string",
          content: getCurrentElement("address") + ": " + (this.address ?? "-"),
        },
        {
          id: this.id + "_email",
          type: "string",
          content: getCurrentElement("email") + ": " + this.email,
        },
      ],
    };
  }
}

type ImageDescriptor = {
  url: string;
  name: string;
};

type DefaultLink = {
  name: string;
  index: number;
};

type AlertInformation = {
  // TODO (9): trovare gli altri posti dove metterlo
  title: string;
  message: string;
  buttons: (string | AlertButton)[];
  inputs?: AlertInput[];
};

enum SubscriptionsManagerMode {
  SELF_SUBSCRIPTION,
  SUBSCRIPTION,
  MOVE,
}

type EnrollmentAvailability = {
  course: EnrollmentCardElements | undefined;
  available_courses: boolean;
  available_credits: boolean;
};

type CourseReferences = {
  learning_area_id: string;
  learning_context_id: string;
  indexes: TmpList<number | string>;
};

class SubscriptionsManager {
  // TODO (4): fare tutte combinazioni tra mode e visualization_type e tenere conto anche dell'utente per risultato carta/riga
  // TODO (4): rifare tutto questo sistema andando a cambiare il funzionamento della tabella in modo tale che sia un array di oggetti o simile ([{row_id,row,enrollment}]) e diventi simile alle card
  private _mode: SubscriptionsManagerMode;
  private _all_courses: TmpList<CardsList<EnrollmentCardElements>>;
  private _courses: OrderedCardsList<EnrollmentCardElements>;
  private _remaining_credits: AlternateList<number>;
  private _remaining_courses: AlternateList<TmpList<number>>;
  private course_correspondences: {
    course_id: number;
    context_id: string;
  }[];
  private last_mentioned_course: {
    id: string | undefined;
    references: {
      learning_area_id: string;
      learning_context_id: string;
    };
    courses_indexes: TmpList<number | string>;
    availabilities: {
      courses: boolean;
      credits: boolean;
    };
  };
  private learning_contexts: LearningContext[];
  private learning_context_index: number;

  constructor(mode = SubscriptionsManagerMode.SELF_SUBSCRIPTION) {
    this._mode = mode;
    this._all_courses = {};
    this._courses = {
      order: [],
      cards: {},
    };
    this._remaining_credits = {};
    this._remaining_courses = {};
    this.course_correspondences = [];
    this.last_mentioned_course = {
      id: undefined,
      references: {
        learning_area_id: "",
        learning_context_id: "",
      },
      courses_indexes: {
        group: "",
        index: -1,
      },
      availabilities: {
        courses: false,
        credits: false,
      },
    };
    this.learning_context_index = -1;
    this.learning_contexts = [];
  }

  reset() {
    this._all_courses = {};
    this._courses = {
      order: [],
      cards: {},
    };
    this._remaining_credits = {};
    this._remaining_courses = {};
    this.course_correspondences = [];
    this.resetLastMentionedCourse();
    this.learning_context_index = -1;
    this.learning_contexts = [];
  }

  async loadParameters(
    student: UserSummary,
    ordinary_class: OrdinaryClassSummary,
    learning_contexts: LearningContext[],
    all_learning_areas: LearningArea[],
    learning_sessions: LearningSession[],
    courses_to_divide: EnrollmentCourse[],
    learning_session_id: string
  ) {
    // TODO (5): mettere parametro data_loaded per bloccare azioni senza aver caricato dati
    // TODO (5): mettere facoltativi parametri per il move
    const learning_session_position = learning_sessions.findIndex(
      (a) => a.id == parseInt(learning_session_id)
    );
    const learning_session =
      learning_session_position != -1
        ? learning_sessions[learning_session_position]
        : undefined;
    const courses_ids = courses_to_divide.map((a: EnrollmentCourse) => a.id);

    let previous_session: LearningSession | undefined,
      learning_context_id: string,
      learning_area_id: string | null;

    this.reset(); // TODO (6): vedere quando non fare (tradeoff richieste-aggiornamento)
    if (learning_session != undefined) {
      this.learning_contexts = learning_contexts;

      await executeLink(
        "/v1/constraints?session_id=" +
          learning_session.id +
          "&study_year=" +
          ordinary_class.study_year +
          "&study_address=" +
          ordinary_class.address,
        (response) => {
          for (const constraint of response.data.data as ConstraintProps[]) {
            learning_context_id = (
              constraint.learning_context_ref.data as { id: string }
            ).id;
            learning_area_id = (
              constraint.learning_area_ref.data as { id: string | null }
            ).id;
            if (this._remaining_courses[learning_context_id] == undefined) {
              this._remaining_courses[learning_context_id] = {};
            }
            if (learning_area_id == null) {
              this._remaining_credits[learning_context_id] = constraint.credits;
              for (let i = 0; i < learning_session.num_groups; i++) {
                this._remaining_courses[learning_context_id][i + 1] =
                  store.state.courses_per_group;
              }
            } else {
              if (this._remaining_credits[learning_context_id] == undefined) {
                this._remaining_credits[learning_context_id] = {};
              }
              (this._remaining_credits[learning_context_id] as TmpList<number>)[
                learning_area_id
              ] = constraint.credits as number;
              (
                this._remaining_courses[learning_context_id] as TmpList<
                  TmpList<number>
                >
              )[learning_area_id] = {};
              for (let i = 0; i < learning_session.num_groups; i++) {
                (
                  this._remaining_courses[learning_context_id] as TmpList<
                    TmpList<number>
                  >
                )[learning_area_id][i + 1] = store.state.courses_per_group;
              }
            }
          }
        }
      );

      await executeLink(
        "/v1/learning_contexts/correspondence?student_id=" +
          student.id +
          "&session_id=" +
          learning_session_id,
        (response) => {
          let tmp_course,
            actual_course: EnrollmentCourse,
            tmp_learning_area: LearningArea | undefined,
            open_enrollment,
            tmp_learning_context,
            context_linked: boolean,
            to_add: EnrollmentCardElements;

          this.course_correspondences = response.data.data;
          for (const correspondence of this.course_correspondences) {
            tmp_course = courses_to_divide.find(
              (a) => a.id == correspondence.course_id
            );
            this.learning_context_index = this.learning_contexts.findIndex(
              (a) => a.id == correspondence.context_id
            );
            if (tmp_course != undefined && this.learning_context_index != -1) {
              tmp_learning_context =
                this.learning_contexts[this.learning_context_index];
              context_linked = isLinkedToAreas(tmp_learning_context);
              actual_course = tmp_course; // Dummy variable to avoid casts in arrow functions
              tmp_learning_area = all_learning_areas.find(
                (a) => a.id == actual_course.learning_area_id
              );
              if (tmp_learning_area != undefined) {
                previous_session =
                  learning_sessions[learning_session_position - 1];
                open_enrollment =
                  learning_session.getStatus() ==
                    LearningSessionStatus.FUTURE &&
                  (previous_session == undefined ||
                    previous_session.getStatus() ==
                      LearningSessionStatus.CURRENT ||
                    previous_session.getStatus() ==
                      LearningSessionStatus.COMPLETED) &&
                  learning_session.open_day <= new Date();
                to_add = actual_course.toEnrollmentCard(
                  learning_session,
                  this.mode == SubscriptionsManagerMode.SELF_SUBSCRIPTION &&
                    open_enrollment
                    ? "/v2/students/" +
                        student.id +
                        "/" +
                        (actual_course.pending !== false
                          ? "unsubscribe"
                          : "subscribe") +
                        "?course_id=" +
                        actual_course.id +
                        "&session_id=" +
                        learning_session_id +
                        "&context_id=" +
                        tmp_learning_context.id
                    : undefined,
                  undefined,
                  this.mode != SubscriptionsManagerMode.SELF_SUBSCRIPTION
                    ? {
                        student_id: student.id,
                        ordinary_class: ordinary_class,
                        to: {
                          learning_context_id: tmp_learning_context.id,
                          learning_area_id: tmp_learning_area.id,
                          course_id: actual_course.id,
                          session_id: parseInt(learning_session_id),
                          final_confirmation: actual_course.final_confirmation,
                          section: actual_course.section,
                        },
                      }
                    : undefined,
                  open_enrollment
                );
                if (this._all_courses[tmp_learning_context.id] == undefined) {
                  this._all_courses[tmp_learning_context.id] = {};
                  for (const learning_area of all_learning_areas) {
                    this._all_courses[tmp_learning_context.id][
                      learning_area.id
                    ] = [];
                  }
                }
                (context_linked
                  ? (
                      this._remaining_courses[
                        tmp_learning_context.id
                      ] as TmpList<TmpList<number>>
                    )[tmp_learning_area.id]
                  : (this._remaining_courses[
                      tmp_learning_context.id
                    ] as TmpList<number>))[actual_course.group] -=
                  to_add.enrollment.enrollment === true ? 1 : 0;
                this._all_courses[tmp_learning_context.id][
                  tmp_learning_area.id
                ].push(to_add);
                if (actual_course.pending === true) {
                  if (tmp_learning_context.credits != null) {
                    (this._remaining_credits[
                      tmp_learning_context.id
                    ] as number) -= actual_course.credits;
                    //this.remaining_credits[tmp_learning_context.id] = tmp_courses.reduce((a,b) => b.pending === true && b.learning_context_id == tmp_learning_context.id ? a - b.credits : a,tmp_learning_context.credits);
                  } else {
                    (
                      this._remaining_credits[
                        tmp_learning_context.id
                      ] as TmpList<number>
                    )[tmp_learning_area.id] -= actual_course.credits;
                    //(this.remaining_credits[tmp_learning_context.id] as TmpList<number>)[tmp_learning_area.id] = tmp_courses.reduce((a,b) => b.pending === true ? a - b.credits : a,tmp_learning_area.credits);
                  }
                }
              }
            }
          }
        },
        undefined,
        "post",
        {
          courses: courses_ids,
        }
      );
    }
  }

  public get mode(): SubscriptionsManagerMode {
    return this._mode;
  }

  public get courses() {
    return this._courses;
  }

  public get all_courses() {
    return this._all_courses;
  }

  public get course() {
    return this._courses.cards[
      this.last_mentioned_course.courses_indexes.group
    ][this.last_mentioned_course.courses_indexes.index as number];
  }

  public get remaing_credits(): AlternateList<number> {
    return this._remaining_credits;
  }

  public get remaining_courses(): AlternateList<TmpList<number>> {
    return this._remaining_courses;
  }

  getCourseReferences(course_id: string): CourseReferences | undefined {
    const learning_context_id = this.course_correspondences.find(
      (a) => a.course_id == parseInt(course_id)
    )?.context_id;

    let learning_areas: string[];
    let learning_area_id: string | undefined;
    let index = -1;
    let count = 0;

    if (learning_context_id != undefined) {
      learning_areas = Object.keys(this.all_courses[learning_context_id]);
      while (learning_area_id == undefined && count < learning_areas.length) {
        index = this._all_courses[learning_context_id][
          learning_areas[count]
        ].findIndex((a) => a.id == course_id);
        if (index != -1) {
          learning_area_id = learning_areas[count];
        }
        count++;
      }
    }

    return learning_context_id != undefined && learning_area_id != undefined
      ? {
          learning_context_id: learning_context_id,
          learning_area_id: learning_area_id,
          indexes: {
            index: index,
          },
        }
      : undefined;
  }

  showCourses(
    learning_context_id: string,
    learning_area_id: string,
    not_to_show?: string[]
  ) {
    this._courses.cards = {};
    this._courses.order = [];

    for (const course of this._all_courses[learning_context_id] != undefined
      ? this._all_courses[learning_context_id][learning_area_id]
      : []) {
      if (
        this.mode == SubscriptionsManagerMode.SELF_SUBSCRIPTION ||
        (not_to_show?.find((b) => b == course.id) == undefined &&
          course.enrollment.enrollment == false)
      ) {
        if (this._courses.cards[course.group] == undefined) {
          this._courses.order.push({
            key: course.group,
            title: getCustomMessage(
              "title",
              getCurrentElement("group") + " " + course.group,
              "title"
            ),
          });
          this._courses.cards[course.group] = [];
        }
        this._courses.cards[course.group].push(course);
      }
    }
    this._courses.order.sort((a, b) =>
      a.key == b.key ? 0 : a.key < b.key ? -1 : 1
    );
    if (Object.keys(this._courses.cards).length == 0) {
      this._courses.cards[""] = [];
    }
  }

  getGroupRemainingCourses(
    learning_context_id: string,
    learning_area_id?: string
  ) {
    const courses_per_context =
      (this.remaining_courses[learning_context_id] as TmpList<
        TmpList<number>
      >) ?? {};
    this.learning_context_index = this.learning_contexts.findIndex(
      (a) => a.id == learning_context_id
    );
    return isLinkedToAreas(this.learning_contexts[this.learning_context_index])
      ? learning_area_id != undefined
        ? courses_per_context[learning_area_id] ?? {}
        : {}
      : (this.remaining_courses[learning_context_id] as TmpList<number>) ?? {};
  }

  private removeCourse(
    context_id: string,
    learning_area_id: string,
    course_id: string
  ) {
    const course_index = this._all_courses[context_id][
      learning_area_id
    ].findIndex((a) => a.id == course_id);

    return this._all_courses[context_id][learning_area_id].splice(
      course_index,
      1
    )[0];
  }

  private updateCourse(
    context_id: string,
    learning_area_id: string,
    to_update: EnrollmentCardElements
  ) {
    this.removeCourse(context_id, learning_area_id, to_update.id);
    this._all_courses[context_id][learning_area_id].push(
      to_update as EnrollmentCardElements
    );
  }

  private resetLastMentionedCourse() {
    this.last_mentioned_course = {
      id: undefined,
      references: {
        learning_area_id: "",
        learning_context_id: "",
      },
      courses_indexes: {
        group: "",
        index: -1,
      },
      availabilities: {
        courses: false,
        credits: false,
      },
    };
  }

  isStudentCompliant() {
    this._remaining_credits["PER"] = 0;
    const learning_contexts = Object.keys(this.remaing_credits);

    let i = 0;
    let j: number;
    let compliant = true;
    let learning_areas: string[];

    while (compliant && i < learning_contexts.length) {
      if (typeof this.remaing_credits[learning_contexts[i]] == "number") {
        compliant = this.remaing_credits[learning_contexts[i]] == 0;
      } else {
        j = 0;
        learning_areas = Object.keys(
          this.remaing_credits[learning_contexts[i]]
        );
        while (
          compliant &&
          typeof this.remaing_credits[learning_contexts[i]] == "object" &&
          j < learning_areas.length
        ) {
          compliant =
            (this.remaing_credits[learning_contexts[i]] as TmpList<number>)[
              learning_areas[j]
            ] == 0;
          j++;
        }
      }
      i++;
    }

    return compliant;
  }

  checkEnrollmentAvailability(
    learning_context_id: string,
    learning_area_id: string,
    course_id: string,
    origin_course_id?: string
  ): EnrollmentAvailability {
    const group_remaining_courses = this.getGroupRemainingCourses(
      learning_context_id,
      learning_area_id
    );
    const groups = Object.keys(group_remaining_courses);
    const moving_from: CourseReferences | undefined =
      origin_course_id != undefined
        ? this.getCourseReferences(origin_course_id)
        : undefined;

    let mentioned_course: EnrollmentCardElements | undefined;
    let tmp_index = -1;
    let count = 0;

    this.resetLastMentionedCourse();
    while (tmp_index == -1 && count < groups.length) {
      if (this._courses.cards[groups[count]] != undefined) {
        tmp_index = this._courses.cards[groups[count]].findIndex(
          (c) => c.id == "" + course_id
        );
      }
      count++;
    }
    if (tmp_index != -1) {
      this.last_mentioned_course.id = course_id;
      this.last_mentioned_course.references.learning_area_id = learning_area_id;
      this.last_mentioned_course.references.learning_context_id =
        learning_context_id;
      this.last_mentioned_course.courses_indexes.group = groups[count - 1];
      this.last_mentioned_course.courses_indexes.index = tmp_index;
      mentioned_course = this.course;
    }

    const origin_course =
      this.mode == SubscriptionsManagerMode.MOVE && moving_from != undefined
        ? this.all_courses[moving_from.learning_context_id][
            moving_from.learning_area_id
          ][moving_from.indexes.index as number]
        : undefined;
    const origin_course_credits =
      origin_course != undefined && moving_from != undefined
        ? origin_course.credits
        : 0;

    this.last_mentioned_course.availabilities = {
      courses:
        this.last_mentioned_course.id != undefined
          ? group_remaining_courses[
              this.last_mentioned_course.courses_indexes.group
            ] +
              (moving_from != undefined &&
              moving_from.learning_context_id == learning_context_id &&
              moving_from.learning_area_id == learning_area_id &&
              this.mode == SubscriptionsManagerMode.MOVE &&
              origin_course != undefined &&
              origin_course.group ==
                this.last_mentioned_course.courses_indexes.group
                ? 1
                : 0) -
              1 >=
            0
          : false,
      credits:
        this.last_mentioned_course.id != undefined
          ? (typeof this._remaining_credits[
              this.last_mentioned_course.references.learning_context_id
            ] == "number"
              ? (this._remaining_credits[
                  this.last_mentioned_course.references.learning_context_id
                ] as number)
              : (
                  this._remaining_credits[
                    this.last_mentioned_course.references.learning_context_id
                  ] as TmpList<number>
                )[this.last_mentioned_course.references.learning_area_id]) +
              (this.last_mentioned_course.references.learning_context_id ==
                moving_from?.learning_context_id &&
              this.last_mentioned_course.references.learning_area_id ==
                moving_from?.learning_area_id
                ? origin_course_credits
                : 0) >=
            this.course.credits
          : false,
    };

    return {
      course: mentioned_course,
      available_courses: this.last_mentioned_course.availabilities.courses,
      available_credits: this.last_mentioned_course.availabilities.credits,
    };
  }

  updateCourseAndLinked(value: Date | boolean) {
    const contexts_to_edit = this.course_correspondences.filter(
      (a) => "" + a.course_id == this.course.id
    );

    let requestArray: string[],
      pathArray: string[],
      card: EnrollmentCardElements;
    let outcome = false;

    if (this.last_mentioned_course.id != undefined) {
      //, edited_course : EnrollmentCardElements;  // TODO (7): forse problema per non aver usato copia profonda di course
      card = this.course;
      if (this.mode == SubscriptionsManagerMode.SELF_SUBSCRIPTION) {
        requestArray = (card.content[3].content as RequestIcon).url.split(
          "?"
        ) ?? ["", ""];
        pathArray = requestArray[0].split("/");
        pathArray.pop();

        for (const context_reference of contexts_to_edit) {
          if (
            context_reference.context_id ==
            this.last_mentioned_course.references.learning_context_id
          ) {
            card.enrollment.enrollment = value;
            card.content[2].content = card.enrollment.toString();
            card.content[2].colors = card.enrollment.getStatusColors();
            if (store.state.static_subscription && value !== false) {
              card.content.splice(3, 1);
            } else if (!store.state.static_subscription) {
              card.content[3].content = card.enrollment.getEnrollmentIcon(
                pathArray.join("/") +
                  (value === false ? "/subscribe?" : "/unsubscribe?") +
                  requestArray[1],
                card.enrollment.getChangingMethod()
              );
              card.content[3].colors = card.enrollment.getChangeButtonColors();
            }
          } else {
            card.enrollment.editable = false; // ? chiedere se in backend, quando è presente il corso per due contesti, c'è il controllo che non sia iscritto nell'altro contesto
            // TODO (5): forse sbagliato, visto che si fa sempre riferimento a course
          }

          this.updateCourse(
            context_reference.context_id,
            this.last_mentioned_course.references.learning_area_id,
            this.course
          );
        }
      } else {
        for (const context_reference of contexts_to_edit) {
          this.course.enrollment.enrollment = value;
          this.updateCourse(
            context_reference.context_id,
            this.last_mentioned_course.references.learning_area_id,
            this.course
          );
        }
        this.showCourses(
          this.last_mentioned_course.references.learning_context_id,
          this.last_mentioned_course.references.learning_area_id
        );
      }
      outcome = true;
    }

    return outcome;
  }

  updateCredits(unsubscribe: boolean) {
    const group_remaining_courses = this.getGroupRemainingCourses(
      this.last_mentioned_course.references.learning_context_id,
      this.last_mentioned_course.references.learning_area_id
    );

    let outcome = false;
    let tmp_credits: number;

    if (this.last_mentioned_course.id != undefined) {
      tmp_credits = this.course.credits;
      group_remaining_courses[this.course.group] += unsubscribe ? 1 : -1;
      if (
        typeof this._remaining_credits[
          this.last_mentioned_course.references.learning_context_id
        ] == "number"
      ) {
        (this._remaining_credits[
          this.last_mentioned_course.references.learning_context_id
        ] as number) += (unsubscribe ? 1 : -1) * tmp_credits;
      } else {
        (
          this._remaining_credits[
            this.last_mentioned_course.references.learning_context_id
          ] as TmpList<number>
        )[this.last_mentioned_course.references.learning_area_id] +=
          (unsubscribe ? 1 : -1) * tmp_credits;
      }
      outcome = true;
    }

    return outcome;
  }
}

enum SuccessCodes {
  GENERIC = "0",
}

enum ErrorCodes {
  GENERIC = "E_0",
  BAD_REQUEST = "E_1",
  UNAUTHORIZED = "E_2",
  ALREADY_EXISTS = "E_3",
}

type Outcome = {
  code: SuccessCodes | ErrorCodes;
  subcode?: number;
  message?: string;
};

type LearningAreasStructures = {
  distribution: TmpList<
    {
      id: string;
    }[]
  >;
  list: LearningArea[];
};

type ConstraintProps = {
  id: number;
  learning_session_ref: ResponseItem<{
    id: number;
  }>;
  ordinary_class_ref: ResponseItem<{
    study_year: number;
  }>; // ? valutare con Pietro di mettere ordinary_class_school_year e learning_area_ref dentro
  ordinary_class_school_year: number;
  learning_area_ref: ResponseItem<{
    id: string | null;
  }>;
  learning_context_ref: ResponseItem<{
    id: string;
  }>;
  credits: number;
};

type StudentGrade<T = number> = {
  student_id: number;
  grade_value: T;
};

export {
  Language,
  Menu,
  MenuItem,
  BaseElement,
  ElementsList,
  OrdinaryClassProps,
  OrdinaryClassSummaryProps,
  OrdinaryClassSummary,
  OrdinaryClass,
  LearningSessionUpdateProps,
  LearningSessionCreateProps,
  LearningSessionProps,
  LearningSession,
  Enrollment,
  MinimumCourseProps,
  MinimizedCourse,
  EnrollmentCourseProps,
  CourseProps,
  CardElements,
  LayoutElement,
  Layout,
  GeneralCardElements,
  GeneralTableCardElements,
  EnrollmentCardElements,
  LearningSessionStatus,
  LearningArea,
  CourseBase,
  CourseSummary,
  EnrollmentCourse,
  CurriculumCourse,
  Course,
  IconAlternatives,
  IconsList,
  StringIcon,
  RequestIcon,
  EventIcon,
  RequestString,
  EventString,
  RequestStringIcon,
  EventStringIcon,
  CardsList,
  OrderedCardsList,
  RequestParameters,
  EventParameters,
  LinkParameters,
  ElementType,
  LinkType,
  ContentType,
  ColorType,
  ColorObject,
  GeneralSubElements,
  IonInputSubElements,
  IonCheckboxSubElements,
  CustomSubElements,
  GeneralCardSubElements,
  SubElements,
  CardSubElements,
  SelectSubElements,
  EditorSubElements,
  CardsCommonElements,
  CardsListElements,
  CardsGridElements,
  Breakpoint,
  BreakpointScope,
  BreakpointVisibility,
  Colors,
  Classes,
  CustomElement,
  TableElement,
  EditableState,
  GradeProps,
  Grade,
  GradesParameters,
  SingleGradesParameters,
  MultipleGradesParameters,
  ProjectClassTeachingsResponse,
  CourseSectionsTeachings,
  StudentSummaryProps,
  StudentProps,
  StudentInformationProps,
  StudentSummary,
  OrdinaryClassStudentProps,
  OrdinaryClassStudent,
  ProjectClassStudent,
  StudentInformation,
  LearningContextSummary,
  LearningContext,
  AnnouncementSummaryProps,
  Announcement,
  AnnouncementSummary,
  AnnouncementParameters,
  Gender,
  GenderKeys,
  AlternateList,
  TmpList,
  Progression,
  LoginInformation,
  UserSummary,
  UserType,
  UserSubType,
  LoginResponse,
  SuccessLoginResponse,
  UserProps,
  User,
  CourseModelProps,
  CourseModel,
  AccessObject,
  PropositionAccessObject,
  PropositionActivities,
  PropositionCharacteristics1,
  PropositionCriterions,
  PropositionDescription,
  PropositionExpectedLearningResults,
  PropositionCharacteristics2,
  PropositionImage,
  PropositionSpecificInformation,
  PropositionTitles,
  PropositionTeacher,
  ModelProposition,
  GrowthAreaProps,
  GrowthArea,
  Pages,
  PropositionListsKeys,
  PropositionRequiredKeys,
  PropositionOptionalKeys,
  PropositionKeys,
  PropositionActions,
  TeachingProps,
  Teaching,
  StudyAddress,
  AccessProposition,
  TeacherProps,
  TeacherSummary,
  Teacher,
  TeacherProposition,
  OpenToConstraint,
  ProjectClassSummaryProps,
  AdminProjectClassProps,
  ProjectClassSummary,
  AdminProjectClass,
  CardListDescription,
  ImageDescriptor,
  DefaultLink,
  AlertInformation,
  SubscriptionsManagerMode,
  EnrollmentAvailability,
  CourseReferences,
  SubscriptionsManager,
  SuccessCodes,
  ErrorCodes,
  Outcome,
  LearningAreasStructures,
  StudentGrade,
  AdminProps,
  Admin,
};
