package main 

import (
	"github.com/gin-gonic/gin"
    "net/http"
)

func main() {
	r := gin.Default()

	r.POST("/generate-map", func(c *gin.Context){
		mapData := generateProceduralMap()
		c.JSON(http.StatusOK, mapData)
	}) 

	r.POST("/generate-npc", func(c *gin.Context) {
		npcDescription := requestAIService()
		npc := NPC{
			Attributes: generateAttributes(), 
			Description: npcDescription,
		}
		c.JSON(http.StatusOK, npc)
	})

	r.Run()
}

func generateProceduralMap() map[string]interface{} {
	return map[string]interface{}{"tiles": []string{}}
}

func generateAttributes() map[string]int {
	return map[string]int{
		"strength": 10,
		"dexterity": 10,
		"constitution": 10,
		"intelligence": 10,
		"wisdom": 10,
		"charisma": 10,
	}
}

func requestAIService() string {
	return "NPC description from AI service"
}

type NPC struct {
    Attributes  map[string]int `json:"attributes"`
    Description string         `json:"description"`
}