package claimant

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"reflect"

	"github.com/factly/dega-server/config"
	"github.com/factly/dega-server/service/fact-check/model"
	"github.com/factly/dega-server/test"
	"github.com/factly/dega-server/util"
	"github.com/factly/x/errorx"
	"github.com/factly/x/loggerx"
	"github.com/factly/x/meilisearchx"
	"github.com/factly/x/middlewarex"
	"github.com/factly/x/renderx"
	"github.com/factly/x/slugx"
	"github.com/factly/x/validationx"
	"gorm.io/gorm"
)

// create - Create claimant
// @Summary Create claimant
// @Description Create claimant
// @Tags Claimant
// @ID add-claimant
// @Consume json
// @Produce json
// @Param X-User header string true "User ID"
// @Param X-Space header string true "Space ID"
// @Param Claimant body claimant true "Claimant Object"
// @Success 201 {object} model.Claimant
// @Failure 400 {array} string
// @Router /fact-check/claimants [post]
func create(w http.ResponseWriter, r *http.Request) {

	sID, err := middlewarex.GetSpace(r.Context())
	if err != nil {
		loggerx.Error(err)
		errorx.Render(w, errorx.Parser(errorx.Unauthorized()))
		return
	}

	uID, err := middlewarex.GetUser(r.Context())
	if err != nil {
		loggerx.Error(err)
		errorx.Render(w, errorx.Parser(errorx.Unauthorized()))
		return
	}

	claimant := &claimant{}

	err = json.NewDecoder(r.Body).Decode(&claimant)

	if err != nil {
		loggerx.Error(err)
		errorx.Render(w, errorx.Parser(errorx.DecodeError()))
		return
	}

	validationError := validationx.Check(claimant)

	if validationError != nil {
		loggerx.Error(errors.New("validation error"))
		errorx.Render(w, validationError)
		return
	}

	// Get table name
	stmt := &gorm.Statement{DB: config.DB}
	_ = stmt.Parse(&model.Claimant{})
	tableName := stmt.Schema.Table

	var claimantSlug string
	if claimant.Slug != "" && slugx.Check(claimant.Slug) {
		claimantSlug = claimant.Slug
	} else {
		claimantSlug = slugx.Make(claimant.Name)
	}

	mediumID := &claimant.MediumID
	if claimant.MediumID == 0 {
		mediumID = nil
	}

	// Check if claimant with same name exist
	if util.CheckName(uint(sID), claimant.Name, tableName) {
		loggerx.Error(errors.New(`claimant with same name exist`))
		errorx.Render(w, errorx.Parser(errorx.SameNameExist()))
		return
	}

	var description string
	// Store HTML description
	if len(claimant.Description.RawMessage) > 0 && !reflect.DeepEqual(claimant.Description, test.NilJsonb()) {
		description, err = util.HTMLDescription(claimant.Description)
		if err != nil {
			loggerx.Error(err)
			errorx.Render(w, errorx.Parser(errorx.GetMessage("cannot parse claimant description", http.StatusUnprocessableEntity)))
			return
		}
	}

	result := &model.Claimant{
		Name:            claimant.Name,
		Slug:            slugx.Approve(&config.DB, claimantSlug, sID, tableName),
		Description:     claimant.Description,
		HTMLDescription: description,
		MediumID:        mediumID,
		SpaceID:         uint(sID),
		TagLine:         claimant.TagLine,
		MetaFields:      claimant.MetaFields,
		Meta:            claimant.Meta,
		HeaderCode:      claimant.HeaderCode,
		FooterCode:      claimant.FooterCode,
	}

	tx := config.DB.WithContext(context.WithValue(r.Context(), userContext, uID)).Begin()
	err = tx.Model(&model.Claimant{}).Create(&result).Error

	if err != nil {
		tx.Rollback()
		loggerx.Error(err)
		errorx.Render(w, errorx.Parser(errorx.DBError()))
		return
	}

	tx.Model(&model.Claimant{}).Preload("Medium").First(&result)

	// Insert into meili index
	meiliObj := map[string]interface{}{
		"id":          result.ID,
		"kind":        "claimant",
		"name":        result.Name,
		"slug":        result.Slug,
		"description": result.Description,
		"tag_line":    result.TagLine,
		"space_id":    result.SpaceID,
	}

	if config.SearchEnabled() {
		_ = meilisearchx.AddDocument("dega", meiliObj)
	}

	tx.Commit()

	if util.CheckNats() {
		if err = util.NC.Publish("claimant.created", result); err != nil {
			loggerx.Error(err)
			errorx.Render(w, errorx.Parser(errorx.InternalServerError()))
			return
		}
	}

	renderx.JSON(w, http.StatusCreated, result)
}
