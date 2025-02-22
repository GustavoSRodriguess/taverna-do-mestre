package main 

import {
	"github.com/gin-gonic/gin"
    "net/http"
}

func  main()  {
	r := gin.Default()

	r.POST("/generate-map", func(c *gin.Context){
		mapData := generateProceduralMap()
		c.JSON(http.StatusOK, mapData)
	}) 

	r.POST("/generate-npc", func(c *gin.Context) {
		npcDesciption := requestAIService()
		npc := NPC{Attributes: generateAttribute(), npcDesciption: npc.Desciption}
		c.JSON(http.StatusOK, npc)
	})

	r.run()
}

func generateProceduralMap() map[string]inteface{} {
	return map[string]inteface{}{"titles": [...]}
}

func requestAIService() string {
	return "Descircao da ia"
}

type NPC struct {
    Attributes  map[string]int `json:"attributes"`
    Description string         `json:"description"`
}