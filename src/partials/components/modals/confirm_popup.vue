<template lang="pug">
    .modal.fade#confirm_popup(tabindex='-1' role="dialog")
        .modal-dialog
            .modal-content
                .modal-header
                    h4.modal-title Confirmation
                .modal-body
                    slot
                .modal-footer
                    button.btn.btn-default(type="button" data-dismiss="modal") Close
                    slot(name="footer")

</template>

<script>
    export default {
        name: "confirm_popup"
    }
</script>

<style scoped>

</style>