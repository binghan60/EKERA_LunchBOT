<script setup>
import GroupSetting from '@/components/GroupSetting.vue'
import { useRoute } from 'vue-router'
const route = useRoute()

const groupId = route.query.groupId
</script>

<template>
  <GroupSetting :groupId="groupId"></GroupSetting>
</template>
