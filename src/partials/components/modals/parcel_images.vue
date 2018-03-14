<template lang="pug">
    // Modal
    .modal.fade.bs-example-modal-lg.parcel_img_pp(role='dialog' v-bind:id="id")
        .modal-dialog.modal-lg
            // Modal content
            .modal-content
                .modal-header
                    button.close(type='button', data-dismiss='modal') ×
                    h4.modal-title Parcel Images
                .modal-body
                    .parcelImagesCarousel.carousel.slide(data-ride="carousel" v-if="images.length > 0" v-bind:id="controlID()")
                        ol.carousel-indicators
                            li(v-for="(img, ind) in images" v-bind:data-target="'#'+controlID()" v-bind:data-slide-to="ind" v-bind:class="{active: ind === 0}")

                        .carousel-inner
                            .item(v-for="(img, ind) in images" v-bind:class="{active: ind === 0}")
                                img(v-bind:src="img" alt="Parcel Images")

                        a.left.carousel-control(v-bind:href="'#'+controlID()" data-slide="prev")
                            .v_cont
                                .v_cell
                                    i.fa.fa-angle-left.fa-2x
                        a.right.carousel-control(v-bind:href="'#'+controlID()" data-slide="next")
                            .v_cont
                                .v_cell
                                    i.fa.fa-angle-right.fa-2x
                    div(v-else)
                        h3.text-center No Data Selected!

</template>

<script>
    export default {
        name: "parcel_images",
        props: {
            images: {
                type: Array,
                default: []
            },
            id: {
                type: String,
                default: 'parcel_images'
            }
        },
        mounted () {
            const self = this;
            $(function() {
                $('#'+self.id).on('show.bs.modal', function () {
                    $("#"+self.controlID()).carousel("pause").removeData();
                    $("#"+self.controlID()).carousel(0);
                });

            });
        },
        methods: {
            controlID () {
                return this.id+'_control'
            }
        }
    }
</script>

<style>
    .parcelImagesCarousel{
        min-height: 300px;
    }
    .v_cont{
        display: table;
        width: 100%;
        height: 100%;
    }
    .v_cont > .v_cell{
        display: table-cell;
        vertical-align: middle;
    }
</style>