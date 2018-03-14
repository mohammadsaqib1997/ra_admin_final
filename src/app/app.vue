<template>
    <router-view v-if="!process"></router-view>
</template>
<style>

</style>
<script>
    export default{
        computed: {
            process: function () {
                return this.$root.compileProc;
            }
        }
    }
</script>