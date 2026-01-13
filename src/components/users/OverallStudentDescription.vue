<template>
  <student-description :id="student_id" />
  <curriculum-list :student_id="student_id" />
</template>

<script setup lang="ts">
/**
 * @displayName OverallStudentDescription
 * @description
 * Aggregated student profile view.
 *
 * It composes `StudentDescription` and `CurriculumList` and takes the student id
 * from the current route.
 */
import { useRoute } from "vue-router";

const $route = useRoute();
const student_id: string = $route.params.id as string;
</script>

<style></style>
