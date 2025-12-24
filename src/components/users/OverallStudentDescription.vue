<template>
  <student-description :id="student_id" />
  <curriculum-list :student_id="student_id" />
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";

const $route = useRoute();
const student_id: string = $route.params.id as string;
</script>

<style></style>
