package cmd

import (
	"log"
	"net/http"

	"github.com/factly/dega-server/config"
	"github.com/factly/dega-server/service"
	"github.com/factly/dega-server/util"
	"github.com/factly/x/meilisearchx"
	"github.com/go-chi/chi"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(serveCmd)
}

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "Starts server for dega-server.",
	Run: func(cmd *cobra.Command, args []string) {
		// db setup
		config.SetupDB()

		meilisearchx.SetupMeiliSearch("dega", []string{"name", "slug", "description", "title", "subtitle", "excerpt", "site_title", "site_address", "tag_line", "review", "review_tag_line"})

		util.ConnectNats()
		defer util.NC.Close()

		r := service.RegisterRoutes()

		go func() {
			promRouter := chi.NewRouter()
			promRouter.Mount("/metrics", promhttp.Handler())
			log.Fatal(http.ListenAndServe(":8001", promRouter))
		}()

		if err := http.ListenAndServe(":8000", r); err != nil {
			log.Fatal(err)
		}
	},
}
