package category

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"reflect"

	"github.com/factly/x/loggerx"
	"gorm.io/gorm"

	"github.com/factly/dega-server/config"
	"github.com/factly/dega-server/service/core/model"
	"github.com/factly/dega-server/test"
	"github.com/factly/dega-server/util"
	"github.com/factly/x/errorx"
	"github.com/factly/x/meilisearchx"
	"github.com/factly/x/middlewarex"
	"github.com/factly/x/renderx"
	"github.com/factly/x/slugx"
	"github.com/factly/x/validationx"
)

// create - Create category
// @Summary Create category
// @Description Create category
// @Tags Category
// @ID add-category
// @Consume json
// @Produce json
// @Param X-User header string true "User ID"
// @Param X-Space header string true "Space ID"
// @Param Category body category true "Category Object"
// @Success 201 {object} model.Category
// @Failure 400 {array} string
// @Router /core/categories [post]
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

	category := &category{}

	err = json.NewDecoder(r.Body).Decode(category)

	if err != nil {
		loggerx.Error(err)
		errorx.Render(w, errorx.Parser(errorx.DecodeError()))
		return
	}

	validationError := validationx.Check(category)

	if validationError != nil {
		loggerx.Error(errors.New("validation error"))
		errorx.Render(w, validationError)
		return
	}

	// Check if parent category exist or not
	if category.ParentID != 0 {
		var parentCat model.Category
		parentCat.ID = category.ParentID
		err = config.DB.Where(&model.Category{SpaceID: uint(sID)}).First(&parentCat).Error

		if err != nil {
			loggerx.Error(err)
			errorx.Render(w, errorx.Parser(errorx.GetMessage("Parent category does not exist", http.StatusUnprocessableEntity)))
			return
		}
	}

	var categorySlug string
	if category.Slug != "" && slugx.Check(category.Slug) {
		categorySlug = category.Slug
	} else {
		categorySlug = slugx.Make(category.Name)
	}

	// Get table name
	stmt := &gorm.Statement{DB: config.DB}
	_ = stmt.Parse(&model.Category{})
	tableName := stmt.Schema.Table

	// Check if category with same name exist
	if util.CheckName(uint(sID), category.Name, tableName) {
		loggerx.Error(errors.New(`category with same name exist`))
		errorx.Render(w, errorx.Parser(errorx.SameNameExist()))
		return
	}

	mediumID := &category.MediumID
	if category.MediumID == 0 {
		mediumID = nil
	}

	parentID := &category.ParentID
	if category.ParentID == 0 {
		parentID = nil
	}

	// Store HTML description
	var description string
	if len(category.Description.RawMessage) > 0 && !reflect.DeepEqual(category.Description, test.NilJsonb()) {
		description, err = util.HTMLDescription(category.Description)
		if err != nil {
			loggerx.Error(err)
			errorx.Render(w, errorx.Parser(errorx.GetMessage("cannot parse category description", http.StatusUnprocessableEntity)))
			return
		}
	}

	result := &model.Category{
		Name:             category.Name,
		Description:      category.Description,
		BackgroundColour: category.BackgroundColour,
		HTMLDescription:  description,
		Slug:             slugx.Approve(&config.DB, categorySlug, sID, tableName),
		ParentID:         parentID,
		MediumID:         mediumID,
		SpaceID:          uint(sID),
		IsFeatured:       category.IsFeatured,
		MetaFields:       category.MetaFields,
		Meta:             category.Meta,
		HeaderCode:       category.HeaderCode,
		FooterCode:       category.FooterCode,
	}
	tx := config.DB.WithContext(context.WithValue(r.Context(), userContext, uID)).Begin()
	err = tx.Model(&model.Category{}).Create(result).Error

	if err != nil {
		tx.Rollback()
		loggerx.Error(err)
		errorx.Render(w, errorx.Parser(errorx.DBError()))
		return
	}

	tx.Model(&model.Category{}).Preload("Medium").First(&result)

	// Insert into meili index
	meiliObj := map[string]interface{}{
		"id":                result.ID,
		"kind":              "category",
		"name":              result.Name,
		"slug":              result.Slug,
		"background_colour": result.BackgroundColour,
		"description":       result.Description,
		"space_id":          result.SpaceID,
		"meta_fields":       result.MetaFields,
	}

	if config.SearchEnabled() {
		_ = meilisearchx.AddDocument("dega", meiliObj)
	}

	tx.Commit()

	if util.CheckNats() {
		if err = util.NC.Publish("category.created", result); err != nil {
			loggerx.Error(err)
			errorx.Render(w, errorx.Parser(errorx.InternalServerError()))
			return
		}
	}

	renderx.JSON(w, http.StatusCreated, result)
}
